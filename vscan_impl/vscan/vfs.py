"""
VSCAN Module 2 — Vehicle Fit Score (VFS)
=========================================
Computes per-class physical accessibility of a detected free slot.
Output: VFS(slot_i, class_c) ∈ [0, 1]

VFS = SFS^0.5 × OCS^0.3 × APS^0.2

SFS = Size Fit Score         — does the slot have enough width for class c?
OCS = Overhang Clearance     — do neighbours encroach?
APS = Approach Path Score    — is the entry path navigable?
"""

import numpy as np
from dataclasses import dataclass
from typing import List, Dict, Optional
from vscan.dvsg import VirtualSlot


# ── Vehicle minimum clearance requirements (pixels) ───────────────
# Based on CMVR-specified vehicle widths + 0.3m door-open buffer
VEHICLE_CLEARANCES: Dict[str, Dict] = {
    "V1": {"min_w": 8,  "min_h": 20, "turn_r": 12, "name": "Two-Wheeler"},
    "V2": {"min_w": 14, "min_h": 24, "turn_r": 18, "name": "Auto-Rickshaw"},
    "V3": {"min_w": 18, "min_h": 42, "turn_r": 30, "name": "Sedan/Hatchback"},
    "V4": {"min_w": 22, "min_h": 46, "turn_r": 36, "name": "SUV/MUV"},
    "V5": {"min_w": 26, "min_h": 65, "turn_r": 50, "name": "Truck/Tempo"},
}

W_BUFFER = 4.0   # extra pixels buffer beyond minimum

VFS_THRESHOLD_RECOMMEND   = 0.65
VFS_THRESHOLD_HIGH_CONF   = 0.85


@dataclass
class NeighbourVehicle:
    """Neighbouring parked vehicle, from YOLOv8-Pose or annotation."""
    cx:          float
    cy:          float
    w:           float
    h:           float
    angle:       float
    class_id:    str


@dataclass
class VFSResult:
    slot_id:     int
    vehicle_class: str
    sfs:         float   # Size Fit Score
    ocs:         float   # Overhang Clearance Score
    aps:         float   # Approach Path Score
    vfs:         float   # composite score
    label:       str     # "High Confidence" / "Recommended" / "Not Recommended"


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + np.exp(-x))


def compute_sfs(slot: VirtualSlot, class_id: str) -> float:
    """
    Size Fit Score: measures width buffer beyond minimum required.
    Returns 0 if slot is too narrow, scales to 1 with generous buffer.
    """
    min_w = VEHICLE_CLEARANCES[class_id]["min_w"]
    slot_w = max(slot.width, slot.height)   # take the longer dim as depth
    slot_narrow = min(slot.width, slot.height)

    if slot_narrow < min_w:
        return 0.0
    score = min(1.0, (slot_narrow - min_w) / W_BUFFER)
    return float(score)


def compute_ocs(slot: VirtualSlot,
                neighbours: List[NeighbourVehicle]) -> float:
    """
    Overhang Clearance Score: penalises neighbours that encroach into the slot.
    """
    slot_narrow = min(slot.width, slot.height)
    if slot_narrow == 0:
        return 0.0

    total_overhang = 0.0
    slot_cx, slot_cy = slot.cx, slot.cy

    for nb in neighbours:
        dist = np.hypot(nb.cx - slot_cx, nb.cy - slot_cy)
        # only consider vehicles within 2 slot-widths
        if dist > slot_narrow * 2.5:
            continue
        # Project neighbour half-width toward slot
        nb_half_w = max(nb.w, nb.h) / 2.0
        overhang = max(0.0, nb_half_w - (dist - slot_narrow / 2.0))
        total_overhang += overhang

    ocs = max(0.0, 1.0 - total_overhang / slot_narrow)
    return float(ocs)


def compute_aps(slot: VirtualSlot,
                class_id: str,
                nearest_lane_dist: float) -> float:
    """
    Approach Path Score: can the vehicle navigate to this slot?
    Based on distance from access lane vs. vehicle turning radius.
    """
    turn_r = VEHICLE_CLEARANCES[class_id]["turn_r"]
    # sigmoid centred at turning_radius; positive when path > turning radius
    score  = _sigmoid(nearest_lane_dist / turn_r - 1.0)
    # invert: closer to lane is better
    score  = 1.0 - score + 0.5   # shift: good when lane is close
    return float(np.clip(score, 0.0, 1.0))


def compute_vfs(slot: VirtualSlot,
                class_id: str,
                neighbours: List[NeighbourVehicle],
                nearest_lane_dist: float = 30.0) -> VFSResult:
    """
    Compute composite Vehicle Fit Score for (slot, vehicle_class).
    """
    sfs = compute_sfs(slot, class_id)
    ocs = compute_ocs(slot, neighbours)
    aps = compute_aps(slot, class_id, nearest_lane_dist)

    # Geometric weighted product: VFS = SFS^0.5 × OCS^0.3 × APS^0.2
    vfs = (sfs ** 0.5) * (ocs ** 0.3) * (aps ** 0.2)
    vfs = float(np.clip(vfs, 0.0, 1.0))

    if vfs >= VFS_THRESHOLD_HIGH_CONF:
        label = "High Confidence"
    elif vfs >= VFS_THRESHOLD_RECOMMEND:
        label = "Recommended"
    else:
        label = "Not Recommended"

    return VFSResult(slot_id=slot.slot_id,
                     vehicle_class=class_id,
                     sfs=sfs, ocs=ocs, aps=aps, vfs=vfs, label=label)


def compute_all_vfs(slots: List[VirtualSlot],
                    neighbours: List[NeighbourVehicle],
                    lane_y_center: float = 320.0,
                    query_class: Optional[str] = None
                    ) -> Dict[str, List[VFSResult]]:
    """
    Compute VFS for all free slots × all vehicle classes (or a single query class).
    Returns dict keyed by class_id.
    """
    classes = [query_class] if query_class else list(VEHICLE_CLEARANCES.keys())
    results: Dict[str, List[VFSResult]] = {c: [] for c in classes}

    for slot in slots:
        lane_dist = abs(slot.cy - lane_y_center)
        for c in classes:
            res = compute_vfs(slot, c, neighbours, lane_dist)
            results[c].append(res)

    return results


def extract_neighbours_from_annotation(ann: dict) -> List[NeighbourVehicle]:
    """Build neighbour list from ground-truth annotation (simulates YOLOv8-Pose)."""
    nbs = []
    for v in ann.get("vehicles", []):
        nbs.append(NeighbourVehicle(
            cx=v["cx"], cy=v["cy"],
            w=v["w"],   h=v["h"],
            angle=v["angle"],
            class_id=v["class_id"]))
    return nbs


def evaluate_vfs(annotations: list, n_eval: int = 200) -> dict:
    """
    Evaluate VFS accuracy against expert labels derived from geometry.
    Expert label = 1.0 if slot is large enough for class c, 0.0 otherwise.
    Returns MAE, RMSE.
    """
    from vscan.dvsg import VirtualSlot
    import numpy as np

    errors = []
    for ann in annotations[:n_eval]:
        neighbours = extract_neighbours_from_annotation(ann)
        for gs in ann.get("slots", []):
            if gs["occupied"]:
                continue
            slot = VirtualSlot(
                slot_id=gs["slot_id"],
                cx=gs["cx"], cy=gs["cy"],
                width=gs["w"], height=gs["h"],
                angle=gs["angle"],
                area=gs["w"] * gs["h"],
                corners=np.array([[0,0],[1,0],[1,1],[0,1]], dtype=np.float32))

            for c_id, specs in VEHICLE_CLEARANCES.items():
                res  = compute_vfs(slot, c_id, neighbours)
                # expert truth: 1 if slot wide enough, 0 otherwise
                expert = 1.0 if min(gs["w"], gs["h"]) >= specs["min_w"] else 0.0
                errors.append(abs(res.vfs - expert))

    errors = np.array(errors)
    return {
        "mae":  float(np.mean(errors)),
        "rmse": float(np.sqrt(np.mean(errors**2))),
        "n_eval_pairs": len(errors),
    }
