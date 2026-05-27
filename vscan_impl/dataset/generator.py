"""
IndPark-Urban Synthetic Dataset Generator
Generates bird's-eye-view parking lot images mimicking Indian unstructured lots.
Vehicle classes: V1=2-wheeler, V2=auto-rickshaw, V3=sedan, V4=SUV, V5=truck
"""

import cv2
import numpy as np
import json
import os
import random
from dataclasses import dataclass, asdict
from typing import List, Tuple, Optional
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# ── Vehicle specs (pixels at 1px = 0.1m scale, so 1 car ≈ 45×18 px) ──────────
VEHICLE_SPECS = {
    "V1": {"name": "two_wheeler",    "w": 8,  "h": 20, "color": (180,180,255), "prob": 0.41},
    "V2": {"name": "auto_rickshaw",  "w": 14, "h": 24, "color": (255,200,100), "prob": 0.14},
    "V3": {"name": "sedan",          "w": 18, "h": 42, "color": (100,200,255), "prob": 0.31},
    "V4": {"name": "suv",            "w": 22, "h": 46, "color": (100,255,150), "prob": 0.11},
    "V5": {"name": "truck",          "w": 26, "h": 65, "color": (255,120,120), "prob": 0.03},
}

# Surface colours
PAVEMENT_COLOR  = (200, 200, 195)
WALL_COLOR      = (80,  80,  80)
LANE_COLOR      = (170, 170, 165)
MARKING_COLOR   = (240, 240, 240)
SHADOW_COLOR    = (160, 160, 155)

IMG_W, IMG_H = 640, 640  # output image size

@dataclass
class VehicleAnnotation:
    class_id:   str
    cx:         float   # centre x (pixels)
    cy:         float   # centre y (pixels)
    w:          float   # width (pixels)
    h:          float   # height (pixels)
    angle:      float   # rotation degrees
    occupied:   bool    # True = space occupied by this vehicle
    entry_time: float   # simulated minutes from start of day

@dataclass
class SlotAnnotation:
    slot_id:    int
    cx:         float
    cy:         float
    w:          float
    h:          float
    angle:      float
    occupied:   bool
    vehicle_class: Optional[str]

@dataclass
class ImageAnnotation:
    image_id:       int
    has_markings:   bool
    weather:        str
    time_of_day:    str
    vehicles:       List[VehicleAnnotation]
    slots:          List[SlotAnnotation]
    free_mask_path: str


def _pick_class() -> str:
    r = random.random()
    cum = 0.0
    for vid, spec in VEHICLE_SPECS.items():
        cum += spec["prob"]
        if r < cum:
            return vid
    return "V3"

def _rotate_rect(cx, cy, w, h, angle_deg):
    """Return 4 corner points of a rotated rectangle."""
    angle = np.radians(angle_deg)
    dx = np.array([-w/2, w/2,  w/2, -w/2])
    dy = np.array([-h/2, -h/2, h/2,  h/2])
    ca, sa = np.cos(angle), np.sin(angle)
    rx = cx + ca * dx - sa * dy
    ry = cy + sa * dx + ca * dy
    return np.stack([rx, ry], axis=1).astype(np.int32)

def _draw_vehicle(canvas, veh: VehicleAnnotation):
    spec = VEHICLE_SPECS[veh.class_id]
    pts  = _rotate_rect(veh.cx, veh.cy, veh.w, veh.h, veh.angle)
    # shadow
    shadow_pts = pts + np.array([[3, 3]])
    cv2.fillPoly(canvas, [shadow_pts.astype(np.int32)], SHADOW_COLOR)
    # body
    cv2.fillPoly(canvas, [pts], spec["color"])
    # windscreen stripe
    cv2.polylines(canvas, [pts], True, (60, 60, 60), 1)

def _draw_bay_marking(canvas, cx, cy, w, h, angle):
    """Dashed white bay lines."""
    pts = _rotate_rect(cx, cy, w + 4, h + 4, angle)
    cv2.polylines(canvas, [pts], True, MARKING_COLOR, 1, cv2.LINE_AA)

def _check_overlap(new_cx, new_cy, new_w, new_h, new_ang,
                   placed, margin=4):
    """Simple axis-aligned bounding box overlap check (fast)."""
    nw, nh = new_w + margin, new_h + margin
    for p in placed:
        pw, ph = p["w"] + margin, p["h"] + margin
        if (abs(new_cx - p["cx"]) < (nw + pw) / 2 and
                abs(new_cy - p["cy"]) < (nh + ph) / 2):
            return True
    return False


def generate_lot(image_id: int,
                 has_markings: bool   = False,
                 weather: str         = "clear",
                 time_of_day: str     = "afternoon",
                 target_vehicles: int = None,
                 out_dir: str         = "dataset/images") -> ImageAnnotation:

    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(out_dir.replace("images", "masks"), exist_ok=True)

    canvas = np.full((IMG_H, IMG_W, 3), PAVEMENT_COLOR, dtype=np.uint8)
    free_mask = np.ones((IMG_H, IMG_W), dtype=np.uint8) * 255  # 255=free

    # ── walls / pillars ───────────────────────────────────────────
    wall_thickness = random.randint(18, 30)
    cv2.rectangle(canvas, (0, 0), (IMG_W, wall_thickness), WALL_COLOR, -1)
    cv2.rectangle(canvas, (0, IMG_H - wall_thickness), (IMG_W, IMG_H), WALL_COLOR, -1)
    cv2.rectangle(canvas, (0, 0), (wall_thickness, IMG_H), WALL_COLOR, -1)
    cv2.rectangle(canvas, (IMG_W - wall_thickness, 0), (IMG_W, IMG_H), WALL_COLOR, -1)
    free_mask[:wall_thickness, :] = 0
    free_mask[IMG_H - wall_thickness:, :] = 0
    free_mask[:, :wall_thickness] = 0
    free_mask[:, IMG_W - wall_thickness:] = 0

    # random internal pillars
    n_pillars = random.randint(0, 4)
    for _ in range(n_pillars):
        px = random.randint(80, IMG_W - 80)
        py = random.randint(80, IMG_H - 80)
        pr = random.randint(8, 14)
        cv2.circle(canvas, (px, py), pr, WALL_COLOR, -1)
        cv2.circle(free_mask, (px, py), pr + 6, 0, -1)

    # ── access lane (horizontal strip in middle) ──────────────────
    lane_y1 = IMG_H // 2 - 30
    lane_y2 = IMG_H // 2 + 30
    cv2.rectangle(canvas, (wall_thickness, lane_y1), (IMG_W - wall_thickness, lane_y2), LANE_COLOR, -1)
    free_mask[lane_y1:lane_y2, wall_thickness:IMG_W - wall_thickness] = 0
    # dashed centre line
    for x in range(wall_thickness, IMG_W - wall_thickness, 20):
        cv2.line(canvas, (x, IMG_H // 2), (x + 10, IMG_H // 2), MARKING_COLOR, 1)

    # ── vehicle placement ─────────────────────────────────────────
    if target_vehicles is None:
        target_vehicles = random.randint(12, 28)

    placed = []
    vehicles_ann = []
    slots_ann    = []
    slot_id_ctr  = 0

    # Define two zones: above lane and below lane
    zones = [
        (wall_thickness + 5, lane_y1 - 5),   # zone top
        (lane_y2 + 5, IMG_H - wall_thickness - 5),  # zone bottom
    ]

    for zone_y1, zone_y2 in zones:
        if zone_y2 - zone_y1 < 30:
            continue
        x = wall_thickness + 5
        while x < IMG_W - wall_thickness - 30:
            vid  = _pick_class()
            spec = VEHICLE_SPECS[vid]
            vw, vh = spec["w"], spec["h"]
            # Random slight angle for realism (Indian parking is chaotic)
            angle = random.uniform(-8, 8) if not has_markings else random.uniform(-2, 2)
            cy_center = (zone_y1 + zone_y2) // 2 + random.randint(-8, 8)
            cx_center = x + vw // 2 + random.randint(-3, 3)

            if cx_center + vw // 2 >= IMG_W - wall_thickness:
                break

            if _check_overlap(cx_center, cy_center, vw, vh, angle, placed):
                x += vw + 4
                continue

            is_occupied = random.random() < 0.65  # 65% fill rate

            if has_markings:
                _draw_bay_marking(canvas, cx_center, cy_center, vw, vh, angle)

            if is_occupied:
                entry_min = random.uniform(0, 480)
                veh = VehicleAnnotation(
                    class_id=vid, cx=float(cx_center), cy=float(cy_center),
                    w=float(vw), h=float(vh), angle=angle,
                    occupied=True, entry_time=entry_min)
                _draw_vehicle(canvas, veh)
                vehicles_ann.append(veh)
                # mark footprint as non-free
                pts = _rotate_rect(cx_center, cy_center, vw + 4, vh + 4, angle)
                cv2.fillPoly(free_mask, [pts], 0)
                vehicle_cls = vid
            else:
                vehicle_cls = None

            slots_ann.append(SlotAnnotation(
                slot_id=slot_id_ctr,
                cx=float(cx_center), cy=float(cy_center),
                w=float(vw + 6), h=float(vh + 6), angle=angle,
                occupied=is_occupied, vehicle_class=vehicle_cls))
            slot_id_ctr += 1

            placed.append({"cx": cx_center, "cy": cy_center, "w": vw, "h": vh})
            x += vw + random.randint(4, 10)

    # ── weather / lighting effects ────────────────────────────────
    if weather == "rain":
        noise = np.random.randint(-18, 18, canvas.shape, dtype=np.int16)
        canvas = np.clip(canvas.astype(np.int16) + noise, 0, 255).astype(np.uint8)
        # rain streaks
        for _ in range(200):
            x1 = random.randint(0, IMG_W)
            y1 = random.randint(0, IMG_H)
            cv2.line(canvas, (x1, y1), (x1 + 2, y1 + 8), (200, 210, 220), 1)
    elif weather == "overcast":
        canvas = (canvas * 0.88).astype(np.uint8)
    elif weather == "night":
        canvas = (canvas * 0.35).astype(np.uint8)
        # headlight circles
        for _ in range(3):
            lx = random.randint(50, IMG_W - 50)
            ly = random.randint(50, IMG_H - 50)
            for r in range(40, 0, -5):
                alpha = max(0, int(120 - r * 3))
                overlay = canvas.copy()
                cv2.circle(overlay, (lx, ly), r, (alpha, alpha, 80), -1)
                cv2.addWeighted(overlay, 0.15, canvas, 0.85, 0, canvas)

    # ── save ──────────────────────────────────────────────────────
    img_path  = os.path.join(out_dir, f"img_{image_id:05d}.jpg")
    mask_path = os.path.join(out_dir.replace("images", "masks"),
                             f"mask_{image_id:05d}.png")
    cv2.imwrite(img_path, canvas)
    cv2.imwrite(mask_path, free_mask)

    ann = ImageAnnotation(
        image_id=image_id,
        has_markings=has_markings,
        weather=weather,
        time_of_day=time_of_day,
        vehicles=vehicles_ann,
        slots=slots_ann,
        free_mask_path=mask_path)
    return ann


def generate_dataset(n_images: int = 500,
                     out_dir:   str = "dataset") -> List[dict]:
    """Generate n_images samples with realistic distribution."""
    os.makedirs(out_dir, exist_ok=True)
    annotations = []
    weathers    = ["clear"] * 6 + ["overcast"] * 2 + ["rain"] * 1 + ["night"] * 1
    times       = ["morning", "afternoon", "evening"]

    for i in range(n_images):
        has_markings = random.random() < 0.20   # 20% have markings (Indian reality)
        weather      = random.choice(weathers)
        tod          = random.choice(times)
        ann = generate_lot(i,
                           has_markings=has_markings,
                           weather=weather,
                           time_of_day=tod,
                           out_dir=os.path.join(out_dir, "images"))
        annotations.append({**asdict(ann),
                             "img_path": f"images/img_{i:05d}.jpg"})
        if (i + 1) % 100 == 0:
            print(f"  Generated {i+1}/{n_images} images")

    ann_path = os.path.join(out_dir, "annotations.json")
    with open(ann_path, "w") as f:
        json.dump(annotations, f, indent=2)
    print(f"Dataset saved → {out_dir}  ({n_images} images, annotations.json)")
    return annotations


if __name__ == "__main__":
    anns = generate_dataset(n_images=500, out_dir="dataset")
    total_veh  = sum(len(a["vehicles"]) for a in anns)
    total_slot = sum(len(a["slots"])    for a in anns)
    print(f"Total vehicles annotated : {total_veh}")
    print(f"Total parking slots      : {total_slot}")
    occ = sum(s["occupied"] for a in anns for s in a["slots"])
    print(f"Occupied slots           : {occ}/{total_slot} "
          f"({100*occ/total_slot:.1f}%)")
