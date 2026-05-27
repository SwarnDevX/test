"""
VSCAN Module 1 — Dynamic Virtual Slot Generation (DVSG)
=========================================================
Infers virtual parking slot polygons from raw overhead images
WITHOUT any pre-annotated bay coordinates.

Pipeline:
  1. Semantic segmentation  → free-space mask (C0)
  2. Morphological erosion  → remove sub-vehicle fragments
  3. Connected Component Analysis (CCA)
  4. Oriented Bounding Rectangle (OBR) fitting per component
  5. Output: list of VirtualSlot objects
"""

import cv2
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple
import json


# ── Minimum parkable dimensions (pixels at our scale) ─────────────
MIN_SLOT_AREA   = 80      # px²  — smaller blobs discarded
MIN_SLOT_WIDTH  = 7       # px
MIN_SLOT_HEIGHT = 16      # px
TWO_WHEELER_KERNEL = (7, 18)   # erosion kernel ~ two-wheeler footprint


@dataclass
class VirtualSlot:
    slot_id:  int
    cx:       float
    cy:       float
    width:    float
    height:   float
    angle:    float          # degrees
    area:     float
    corners:  np.ndarray     # shape (4,2) float32


# ── Stage 1: Colour-based free-space segmentation ─────────────────

def segment_free_space(bgr_img: np.ndarray) -> np.ndarray:
    """
    Produce binary free-space mask (255 = free ground, 0 = occupied/structure).
    Uses HSV colour thresholding tuned to synthetic lot colours,
    plus edge-guided refinement for real images.
    """
    h, w = bgr_img.shape[:2]
    hsv   = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2HSV)
    gray  = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY)

    # --- pavement is low-saturation, medium-brightness grey ---
    pavement_mask = cv2.inRange(hsv,
                                np.array([0,   0, 140]),
                                np.array([180, 40, 220]))

    # --- vehicle pixels are colourful (higher saturation) OR very dark ---
    vehicle_mask = cv2.inRange(hsv,
                               np.array([0,  50, 30]),
                               np.array([180, 255, 255]))

    # --- dark structural elements (walls, pillars) ---
    dark_mask = cv2.inRange(bgr_img,
                            np.array([0,  0,  0]),
                            np.array([100, 100, 100]))

    # Free = pavement AND NOT vehicle AND NOT dark structure
    free_mask = cv2.bitwise_and(pavement_mask,
                                cv2.bitwise_not(vehicle_mask))
    free_mask = cv2.bitwise_and(free_mask, cv2.bitwise_not(dark_mask))

    # Remove lane centre strip (roughly horizontal mid-band)
    # Lane has slightly different tone than parking bays
    # Use gradient: lane has low horizontal gradient
    sobel_x = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    low_grad = (np.abs(sobel_x) < 8).astype(np.uint8) * 255
    # If an area is free AND low-gradient AND in the mid-third → likely lane
    mid_top    = h // 3
    mid_bottom = 2 * h // 3
    lane_candidate = np.zeros_like(free_mask)
    lane_candidate[mid_top:mid_bottom, :] = low_grad[mid_top:mid_bottom, :]
    # Erode lane candidate heavily — only confident horizontal bands removed
    lane_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (80, 1))
    lane_candidate = cv2.erode(lane_candidate, lane_kernel)
    lane_candidate = cv2.dilate(lane_candidate, cv2.getStructuringElement(
        cv2.MORPH_RECT, (80, 30)))
    free_mask = cv2.bitwise_and(free_mask, cv2.bitwise_not(lane_candidate))

    # Median blur to remove salt-and-pepper noise
    free_mask = cv2.medianBlur(free_mask, 5)
    return free_mask


# ── Stage 2 & 3: Erosion + Connected Components ───────────────────

def extract_components(free_mask: np.ndarray
                       ) -> List[Tuple[np.ndarray, dict]]:
    """
    Apply morphological erosion then find connected components.
    Returns list of (component_mask, stats).
    """
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, TWO_WHEELER_KERNEL)
    eroded = cv2.erode(free_mask, kernel, iterations=1)
    eroded = cv2.dilate(eroded, kernel, iterations=1)   # reconstruct area

    n_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
        eroded, connectivity=8)

    components = []
    for lbl in range(1, n_labels):   # skip background (0)
        area = stats[lbl, cv2.CC_STAT_AREA]
        if area < MIN_SLOT_AREA:
            continue
        comp_mask = (labels == lbl).astype(np.uint8) * 255
        components.append((comp_mask, {
            "area":     area,
            "cx":       centroids[lbl][0],
            "cy":       centroids[lbl][1],
            "x":        stats[lbl, cv2.CC_STAT_LEFT],
            "y":        stats[lbl, cv2.CC_STAT_TOP],
            "w":        stats[lbl, cv2.CC_STAT_WIDTH],
            "h":        stats[lbl, cv2.CC_STAT_HEIGHT],
        }))
    return components


# ── Stage 4: OBR fitting ──────────────────────────────────────────

def fit_oriented_rect(comp_mask: np.ndarray,
                      min_box_area: float = MIN_SLOT_AREA
                      ) -> List[Tuple]:
    """
    Find contours in component mask, fit minimum-area OBR to each.
    A large free region may contain multiple slots → split by width.
    """
    contours, _ = cv2.findContours(comp_mask, cv2.RETR_EXTERNAL,
                                   cv2.CHAIN_APPROX_SIMPLE)
    slots = []
    for cnt in contours:
        if cv2.contourArea(cnt) < min_box_area:
            continue
        rect  = cv2.minAreaRect(cnt)   # ((cx,cy), (w,h), angle)
        (cx, cy), (rw, rh), angle = rect

        # Ensure w < h convention (height is the longer side)
        if rw > rh:
            rw, rh = rh, rw
            angle  = angle + 90

        # Filter unrealistically small
        if rw < MIN_SLOT_WIDTH or rh < MIN_SLOT_HEIGHT:
            continue

        box = cv2.boxPoints(rect).astype(np.float32)

        # Large free regions → sub-divide into individual vehicle-sized slots
        slots_wide = max(1, int(round(rw / 22)))   # 22px ≈ sedan width
        sub_w      = rw / slots_wide
        for k in range(slots_wide):
            offset_x = (k - (slots_wide - 1) / 2) * sub_w
            ang_rad   = np.radians(angle)
            sub_cx    = cx + np.cos(ang_rad) * offset_x
            sub_cy    = cy + np.sin(ang_rad) * offset_x
            sub_box   = cv2.boxPoints(((sub_cx, sub_cy),
                                       (sub_w,   rh), angle)).astype(np.float32)
            slots.append((sub_cx, sub_cy, sub_w, rh, angle, sub_box))
    return slots


# ── Public API ────────────────────────────────────────────────────

def run_dvsg(bgr_img: np.ndarray,
             debug: bool = False
             ) -> Tuple[List[VirtualSlot], np.ndarray, np.ndarray]:
    """
    Full DVSG pipeline on one image.
    Returns:
        virtual_slots  : list of VirtualSlot
        free_mask      : binary mask (255=free)
        debug_img      : annotated image (if debug=True)
    """
    free_mask  = segment_free_space(bgr_img)
    components = extract_components(free_mask)

    virtual_slots = []
    slot_id = 0
    for comp_mask, stats in components:
        rects = fit_oriented_rect(comp_mask)
        for cx, cy, w, h, angle, corners in rects:
            virtual_slots.append(VirtualSlot(
                slot_id=slot_id,
                cx=float(cx), cy=float(cy),
                width=float(w), height=float(h),
                angle=float(angle),
                area=float(w * h),
                corners=corners))
            slot_id += 1

    debug_img = bgr_img.copy()
    if debug:
        # Draw free mask overlay
        overlay = debug_img.copy()
        overlay[free_mask > 0] = (0, 255, 128)
        cv2.addWeighted(overlay, 0.25, debug_img, 0.75, 0, debug_img)
        # Draw virtual slots
        for vs in virtual_slots:
            pts = vs.corners.astype(np.int32)
            cv2.polylines(debug_img, [pts], True, (0, 200, 255), 2)
            cv2.circle(debug_img, (int(vs.cx), int(vs.cy)), 3, (0, 200, 255), -1)
            cv2.putText(debug_img, f"S{vs.slot_id}",
                        (int(vs.cx) - 8, int(vs.cy) - 5),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.35, (255, 255, 0), 1)

    return virtual_slots, free_mask, debug_img


def compute_iou_slot(pred: VirtualSlot,
                     gt_cx, gt_cy, gt_w, gt_h, gt_angle) -> float:
    """
    Compute rotated IoU between predicted and ground-truth slot polygons.
    Both polygons are centred at canvas origin before comparison.
    """
    canvas_size = 160
    half = canvas_size // 2

    # Centre predicted polygon at origin then offset to canvas centre
    pred_pts  = pred.corners.astype(np.float32)
    pred_cent = pred_pts.mean(axis=0)
    pred_norm = (pred_pts - pred_cent + half).astype(np.int32)

    # Build GT polygon centred at canvas centre
    gt_rect = ((float(half), float(half)), (float(gt_w), float(gt_h)), float(gt_angle))
    gt_pts  = cv2.boxPoints(gt_rect).astype(np.int32)

    m1 = np.zeros((canvas_size, canvas_size), dtype=np.uint8)
    m2 = np.zeros((canvas_size, canvas_size), dtype=np.uint8)
    cv2.fillPoly(m1, [pred_norm], 255)
    cv2.fillPoly(m2, [gt_pts],   255)

    inter_area = np.count_nonzero(cv2.bitwise_and(m1, m2))
    union_area = np.count_nonzero(cv2.bitwise_or(m1, m2))
    return inter_area / union_area if union_area > 0 else 0.0


def evaluate_dvsg(annotations: list,
                  img_dir: str,
                  n_eval: int = 50) -> dict:
    """
    Evaluate DVSG against ground-truth slot annotations.
    Returns mean IoU, precision, recall over n_eval images.
    """
    ious, precs, recs = [], [], []
    eval_anns = [a for a in annotations if not a["has_markings"]][:n_eval]

    for ann in eval_anns:
        img_path = os.path.join(img_dir, "..", ann["img_path"])
        img = cv2.imread(img_path)
        if img is None:
            continue

        pred_slots, _, _ = run_dvsg(img)
        gt_slots = ann["slots"]

        matched_gt  = set()
        matched_pr  = set()

        for pi, ps in enumerate(pred_slots):
            best_iou = 0.0
            best_gi  = -1
            for gi, gs in enumerate(gt_slots):
                if gi in matched_gt:
                    continue
                iou = compute_iou_slot(ps,
                                       gs["cx"], gs["cy"],
                                       gs["w"],  gs["h"],
                                       gs["angle"])
                if iou > best_iou:
                    best_iou = iou
                    best_gi  = gi
            if best_iou > 0.3:
                matched_gt.add(best_gi)
                matched_pr.add(pi)
                ious.append(best_iou)

        tp = len(matched_pr)
        prec = tp / len(pred_slots)  if pred_slots else 0
        rec  = tp / len(gt_slots)    if gt_slots   else 0
        precs.append(prec)
        recs.append(rec)

    return {
        "mean_iou":   float(np.mean(ious))   if ious   else 0.0,
        "precision":  float(np.mean(precs))  if precs  else 0.0,
        "recall":     float(np.mean(recs))   if recs   else 0.0,
        "n_eval":     len(eval_anns),
    }


import os
