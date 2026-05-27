"""
VSCAN Module 5 — Destination-Weighted Slot Recommender (DWSR)
==============================================================
Recommends the optimal parking slot for a driver given:
  - vehicle class c
  - destination node d within facility graph G
  - VFS scores for all free slots
  - TDP predictions for occupied slots

Uses Dijkstra's shortest path on a facility graph.
"""

import numpy as np
import heapq
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Tuple
from vscan.vfs import VFSResult, VFS_THRESHOLD_RECOMMEND
from vscan.tdp import DwellPrediction


# ── Facility graph ────────────────────────────────────────────────

@dataclass
class GraphNode:
    node_id:   int
    label:     str
    x:         float
    y:         float
    node_type: str   # "slot" | "waypoint" | "destination" | "entrance"


@dataclass
class Recommendation:
    rank:           int
    slot_id:        int
    slot_cx:        float
    slot_cy:        float
    vfs:            float
    vfs_label:      str
    walk_time_sec:  float
    drive_time_sec: float
    total_time_sec: float
    occupied:       bool
    eta_free_min:   Optional[float]   # None if currently free
    reason:         str


class FacilityGraph:
    """
    Lightweight directed graph for facility navigation.
    Edge weight = walking time in seconds (1 pixel ≈ 0.1m, walk 1.2 m/s).
    """
    WALK_SPEED_PX_PER_SEC = 12.0    # 1.2 m/s at 0.1m/px

    def __init__(self):
        self.nodes: Dict[int, GraphNode] = {}
        self.adj:   Dict[int, List[Tuple[int, float]]] = {}  # node_id → [(nb_id, weight)]
        self._next_id = 0

    def add_node(self, label: str, x: float, y: float,
                 node_type: str = "waypoint") -> int:
        nid = self._next_id
        self.nodes[nid] = GraphNode(nid, label, x, y, node_type)
        self.adj[nid]   = []
        self._next_id  += 1
        return nid

    def add_edge(self, a: int, b: int, weight: Optional[float] = None):
        if weight is None:
            n1, n2 = self.nodes[a], self.nodes[b]
            dist   = np.hypot(n2.x - n1.x, n2.y - n1.y)
            weight = dist / self.WALK_SPEED_PX_PER_SEC
        self.adj[a].append((b, weight))
        self.adj[b].append((a, weight))   # undirected

    def dijkstra(self, src: int) -> Dict[int, float]:
        """Single-source shortest paths from src. Returns {node_id: dist}."""
        dist = {nid: np.inf for nid in self.nodes}
        dist[src] = 0.0
        pq = [(0.0, src)]
        while pq:
            d, u = heapq.heappop(pq)
            if d > dist[u]:
                continue
            for v, w in self.adj.get(u, []):
                nd = d + w
                if nd < dist[v]:
                    dist[v] = nd
                    heapq.heappush(pq, (nd, v))
        return dist

    @classmethod
    def build_from_slots(cls,
                         slots: List[dict],
                         img_w: int = 640,
                         img_h: int = 640) -> "FacilityGraph":
        """
        Build a facility graph automatically from slot annotations.
        Adds: entrance node, 4 destination nodes (exits/lifts), lane waypoints,
        and one graph node per parking slot.
        """
        g = cls()

        # ── fixed facility nodes ─────────────────────────────────
        entrance  = g.add_node("Entrance",    img_w // 2, img_h - 25, "entrance")
        lift_a    = g.add_node("Lift A",      img_w // 4, 25,         "destination")
        lift_b    = g.add_node("Lift B",      3 * img_w // 4, 25,     "destination")
        exit_l    = g.add_node("Exit Left",   25,         img_h // 2, "destination")
        exit_r    = g.add_node("Exit Right",  img_w - 25, img_h // 2, "destination")
        lane_mid  = g.add_node("Lane Centre", img_w // 2, img_h // 2, "waypoint")
        lane_l    = g.add_node("Lane Left",   img_w // 4, img_h // 2, "waypoint")
        lane_r    = g.add_node("Lane Right",  3 * img_w // 4, img_h // 2, "waypoint")

        # Lane connectivity
        g.add_edge(entrance, lane_mid)
        g.add_edge(lane_mid, lane_l)
        g.add_edge(lane_mid, lane_r)
        g.add_edge(lane_l,   lift_a)
        g.add_edge(lane_r,   lift_b)
        g.add_edge(lane_l,   exit_l)
        g.add_edge(lane_r,   exit_r)

        # ── slot nodes ───────────────────────────────────────────
        lane_nodes = [lane_mid, lane_l, lane_r]
        for slot in slots:
            snid = g.add_node(f"Slot_{slot['slot_id']}",
                              slot["cx"], slot["cy"], "slot")
            # Connect slot to nearest lane node
            best_lane, best_d = min(
                ((ln, np.hypot(g.nodes[ln].x - slot["cx"],
                               g.nodes[ln].y - slot["cy"]))
                 for ln in lane_nodes),
                key=lambda t: t[1])
            g.add_edge(snid, best_lane)

        g._entrance_id    = entrance
        g._destination_ids = {
            "Lift A":     lift_a,
            "Lift B":     lift_b,
            "Exit Left":  exit_l,
            "Exit Right": exit_r,
        }
        g._slot_node_map = {
            s["slot_id"]: g._next_id - len(slots) + i
            for i, s in enumerate(slots)
        }
        return g


class DWSR:
    """
    Destination-Weighted Slot Recommender.
    """

    def __init__(self, graph: FacilityGraph):
        self.graph = graph
        # Pre-compute shortest paths from each destination
        self._dest_paths: Dict[int, Dict[int, float]] = {}
        for dname, did in graph._destination_ids.items():
            self._dest_paths[did] = graph.dijkstra(did)

    def recommend(self,
                  vfs_results:      List[VFSResult],
                  dwell_preds:      Dict[int, DwellPrediction],
                  occupied_slots:   List[dict],
                  free_slots:       List[dict],
                  destination:      str,
                  wait_threshold:   float = 15.0,
                  top_k:            int   = 3
                  ) -> List[Recommendation]:
        """
        Recommend top_k parking slots for a driver headed to destination.

        Args:
            vfs_results:    VFS scores for free slots
            dwell_preds:    TDP departure predictions {slot_id: DwellPrediction}
            occupied_slots: occupied slot dicts
            free_slots:     free slot dicts
            destination:    e.g. "Lift A", "Exit Right"
            wait_threshold: max minutes willing to wait for occupied slot
            top_k:          number of top recommendations to return
        """
        dest_id = self.graph._destination_ids.get(destination)
        if dest_id is None:
            dest_id = list(self.graph._destination_ids.values())[0]

        dest_dists = self._dest_paths[dest_id]
        entrance_id = self.graph._entrance_id

        candidates = []

        # ── Free slots with adequate VFS ─────────────────────────
        vfs_by_sid = {r.slot_id: r for r in vfs_results
                      if r.vfs >= VFS_THRESHOLD_RECOMMEND}

        for fs in free_slots:
            sid = fs["slot_id"]
            if sid not in vfs_by_sid:
                continue
            vr  = vfs_by_sid[sid]
            nid = self.graph._slot_node_map.get(sid)
            if nid is None:
                continue
            walk_t  = dest_dists.get(nid, np.inf)
            drive_t = dest_dists.get(entrance_id, 0.0)
            total   = walk_t + drive_t
            candidates.append(Recommendation(
                rank=0, slot_id=sid,
                slot_cx=fs["cx"], slot_cy=fs["cy"],
                vfs=vr.vfs, vfs_label=vr.label,
                walk_time_sec=walk_t,
                drive_time_sec=drive_t,
                total_time_sec=total,
                occupied=False,
                eta_free_min=None,
                reason=f"VFS={vr.vfs:.2f} | Walk to {destination}: "
                       f"{walk_t:.0f}s | Currently free"))

        # ── Occupied slots likely free soon ───────────────────────
        for os_ in occupied_slots:
            sid  = os_["slot_id"]
            pred = dwell_preds.get(sid)
            if pred is None or pred.t_med > wait_threshold:
                continue
            # Check VFS for this slot's dimensions
            nid     = self.graph._slot_node_map.get(sid)
            if nid is None:
                continue
            walk_t  = dest_dists.get(nid, np.inf)
            drive_t = dest_dists.get(entrance_id, 0.0)
            # Add expected wait
            total   = walk_t + drive_t + pred.t_med * 60
            candidates.append(Recommendation(
                rank=0, slot_id=sid,
                slot_cx=os_["cx"], slot_cy=os_["cy"],
                vfs=0.70, vfs_label="Predicted Free",
                walk_time_sec=walk_t,
                drive_time_sec=drive_t,
                total_time_sec=total,
                occupied=True,
                eta_free_min=pred.t_med,
                reason=f"Free in ~{pred.t_med:.0f} min | Walk to "
                       f"{destination}: {walk_t:.0f}s"))

        # Sort and rank
        candidates.sort(key=lambda r: r.total_time_sec)
        top = candidates[:top_k]
        for i, r in enumerate(top):
            r.rank = i + 1

        return top

    def format_output(self, recs: List[Recommendation]) -> str:
        lines = ["=" * 60,
                 f"  VSCAN — Top {len(recs)} Slot Recommendations",
                 "=" * 60]
        for r in recs:
            status = ("Free now" if not r.occupied
                      else f"Occupied — free in ~{r.eta_free_min:.0f} min")
            lines += [
                f"  Rank #{r.rank} → Slot {r.slot_id}",
                f"    Status      : {status}",
                f"    VFS         : {r.vfs:.2f}  [{r.vfs_label}]",
                f"    Walk time   : {r.walk_time_sec:.0f} sec",
                f"    Total time  : {r.total_time_sec:.0f} sec",
                f"    Reason      : {r.reason}",
                "",
            ]
        lines.append("=" * 60)
        return "\n".join(lines)


def evaluate_dwsr(recs_list: List[List[Recommendation]],
                  gt_best_slots: List[int]) -> dict:
    """Hit-rate@3: is expert's best slot in top-3 recommendations?"""
    hits = sum(
        1 for recs, gt in zip(recs_list, gt_best_slots)
        if any(r.slot_id == gt for r in recs))
    return {
        "hit_rate_at3": hits / len(gt_best_slots) if gt_best_slots else 0.0,
        "n_queries": len(gt_best_slots),
    }
