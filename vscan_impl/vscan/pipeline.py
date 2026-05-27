"""
VSCAN — End-to-End Pipeline
============================
Connects all 5 modules for single-image inference and produces:
  - Annotated output image with slot status overlay
  - VFS heatmap
  - TDP departure labels
  - DWSR top-3 recommendations
"""

import cv2
import numpy as np
import os
from typing import List, Dict, Optional, Tuple
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

from vscan.dvsg  import run_dvsg, VirtualSlot
from vscan.vfs   import (compute_all_vfs, extract_neighbours_from_annotation,
                         VEHICLE_CLEARANCES, VFSResult)
from vscan.tdp   import TDPModel, DwellFeatures, DwellPrediction, DWELL_PRIORS
from vscan.mdad  import MDADClassifier, estimate_depth_map
from vscan.dwsr  import DWSR, FacilityGraph, Recommendation


# ── Colour palette ────────────────────────────────────────────────
COLOR_FREE       = (0,  220,  80)   # green
COLOR_OCCUPIED   = (0,   60, 220)   # red-ish blue
COLOR_NO_FIT     = (30, 30,  180)   # dark red
COLOR_SOON_FREE  = (0,  190, 240)   # amber
COLOR_RECOMMEND  = (255, 220,   0)  # bright yellow (top rec)
FONT = cv2.FONT_HERSHEY_SIMPLEX


class VSCANPipeline:

    def __init__(self,
                 tdp_model:       TDPModel,
                 mdad_classifier: MDADClassifier,
                 query_class:     str = "V3",
                 destination:     str = "Lift A",
                 wait_threshold:  float = 15.0):
        self.tdp        = tdp_model
        self.mdad       = mdad_classifier
        self.q_class    = query_class
        self.dest       = destination
        self.wait_thr   = wait_threshold

    def run(self,
            bgr_img:    np.ndarray,
            annotation: Optional[dict] = None,
            verbose:    bool = True
            ) -> Tuple[np.ndarray, List[Recommendation], dict]:
        """
        Full pipeline on one frame.
        Returns (output_image, recommendations, metrics_dict).
        """
        h, w = bgr_img.shape[:2]
        out  = bgr_img.copy()

        # ─── Module 4: MDAD — depth map ─────────────────────────
        depth_map = estimate_depth_map(bgr_img)

        # ─── Module 1: DVSG — virtual slot detection ─────────────
        virtual_slots, free_mask, _ = run_dvsg(bgr_img)

        if verbose:
            print(f"  [DVSG] {len(virtual_slots)} virtual slots detected")

        # ─── Module 2: VFS — per-slot accessibility ───────────────
        if annotation:
            neighbours = extract_neighbours_from_annotation(annotation)
        else:
            neighbours = []

        vfs_results_all = compute_all_vfs(
            virtual_slots, neighbours,
            lane_y_center=h // 2,
            query_class=self.q_class)
        vfs_q = vfs_results_all[self.q_class]

        # ─── Module 3: TDP — occupancy + dwell prediction ────────
        # Use MDAD classifier if trained, else use annotation ground truth
        if self.mdad.trained and annotation is None:
            occ_preds = self.mdad.predict_all_slots(bgr_img, virtual_slots)
        else:
            # Use ground-truth (simulation mode)
            occ_preds = []
            gt_occ = {}
            if annotation:
                for sl in annotation.get("slots", []):
                    gt_occ[sl["slot_id"]] = sl["occupied"]
            for vs in virtual_slots:
                occ = gt_occ.get(vs.slot_id, free_mask[int(vs.cy), int(vs.cx)] == 0)
                occ_preds.append((vs.slot_id, int(occ), 0.9))

        occ_map = {sid: (occ, conf) for sid, occ, conf in occ_preds}

        free_slots_d, occ_slots_d = [], []
        for vs in virtual_slots:
            d = {"slot_id": vs.slot_id, "cx": vs.cx, "cy": vs.cy,
                 "w": vs.width, "h": vs.height}
            sid, (occ, _) = vs.slot_id, occ_map.get(vs.slot_id, (0, 0.9))
            if occ:
                occ_slots_d.append(d)
            else:
                free_slots_d.append(d)

        dwell_preds: Dict[int, DwellPrediction] = {}
        for osd in occ_slots_d:
            veh_cls = "V3"
            prior   = DWELL_PRIORS[veh_cls]
            feat    = DwellFeatures(
                entry_time_min=480.0,
                elapsed_min=np.random.uniform(0, 60),
                vehicle_class=veh_cls,
                day_of_week=1,
                hist_mu=prior["mu"],
                hist_sigma=prior["sigma"])
            dwell_preds[osd["slot_id"]] = self.tdp.predict(osd["slot_id"], feat)

        # ─── Module 5: DWSR — recommendation ─────────────────────
        graph = FacilityGraph.build_from_slots(
            free_slots_d + occ_slots_d, img_w=w, img_h=h)
        recommender = DWSR(graph)
        recs = recommender.recommend(
            vfs_results=vfs_q,
            dwell_preds=dwell_preds,
            occupied_slots=occ_slots_d,
            free_slots=free_slots_d,
            destination=self.dest,
            wait_threshold=self.wait_thr,
            top_k=3)

        rec_slot_ids = {r.slot_id for r in recs}

        # ─── Visualisation ────────────────────────────────────────
        # Depth overlay (faint)
        depth_uint8 = (depth_map * 180).astype(np.uint8)
        depth_color = cv2.applyColorMap(depth_uint8, cv2.COLORMAP_BONE)
        cv2.addWeighted(depth_color, 0.15, out, 0.85, 0, out)

        vfs_by_sid = {r.slot_id: r for r in vfs_q}

        for vs in virtual_slots:
            sid   = vs.slot_id
            is_occ = occ_map.get(sid, (0,))[0]
            vr    = vfs_by_sid.get(sid)
            is_top = sid in rec_slot_ids

            pts = vs.corners.astype(np.int32)

            if is_occ:
                dp = dwell_preds.get(sid)
                if dp and dp.t_med <= self.wait_thr:
                    color     = COLOR_SOON_FREE
                    thickness = 2
                else:
                    color     = COLOR_OCCUPIED
                    thickness = 1
            elif vr and vr.vfs >= 0.65:
                color     = COLOR_FREE
                thickness = 2
            else:
                color     = COLOR_NO_FIT
                thickness = 1

            if is_top:
                color     = COLOR_RECOMMEND
                thickness = 3

            cv2.polylines(out, [pts], True, color, thickness, cv2.LINE_AA)

            # Fill with transparent colour
            overlay = out.copy()
            fill_c = tuple(max(0, c - 80) for c in color)
            cv2.fillPoly(overlay, [pts], fill_c)
            cv2.addWeighted(overlay, 0.20, out, 0.80, 0, out)

            # Labels
            lx, ly = int(vs.cx), int(vs.cy)
            if is_top:
                rank = next((r.rank for r in recs if r.slot_id == sid), "")
                cv2.putText(out, f"#{rank}", (lx - 8, ly - 2),
                            FONT, 0.5, COLOR_RECOMMEND, 2)
            elif not is_occ and vr:
                cv2.putText(out, f"{vr.vfs:.2f}", (lx - 10, ly),
                            FONT, 0.3, COLOR_FREE, 1)
            elif is_occ:
                dp = dwell_preds.get(sid)
                if dp and dp.t_med <= self.wait_thr:
                    cv2.putText(out, f"~{dp.t_med:.0f}m", (lx - 10, ly),
                                FONT, 0.3, COLOR_SOON_FREE, 1)

        # Legend
        legend_items = [
            (COLOR_FREE,      "Free (VFS OK)"),
            (COLOR_OCCUPIED,  "Occupied"),
            (COLOR_SOON_FREE, "Free soon"),
            (COLOR_NO_FIT,    "Not Fit"),
            (COLOR_RECOMMEND, "Recommended"),
        ]
        for i, (c, label) in enumerate(legend_items):
            ly_pos = 15 + i * 18
            cv2.rectangle(out, (5, ly_pos - 10), (15, ly_pos), c, -1)
            cv2.putText(out, label, (18, ly_pos),
                        FONT, 0.38, (240, 240, 240), 1)

        # Destination label
        cv2.putText(out, f"Query: {self.q_class} → {self.dest}",
                    (w - 220, 18), FONT, 0.4, (255, 255, 200), 1)

        metrics = {
            "n_virtual_slots": len(virtual_slots),
            "n_free":          len(free_slots_d),
            "n_occupied":      len(occ_slots_d),
            "n_recs":          len(recs),
        }

        if verbose:
            print(f"  [VFS]  {len([r for r in vfs_q if r.vfs>=0.65])} "
                  f"slots fit for {self.q_class}")
            print(f"  [DWSR] {len(recs)} recommendations for {self.dest}")

        return out, recs, metrics
