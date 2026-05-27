"""
VSCAN Module 4 — Monocular Depth-Augmented Detection (MDAD)
=============================================================
Estimates a per-frame depth proxy from a single RGB overhead camera
and uses it as a 4th channel to improve occupancy detection accuracy,
especially for occluded vehicles.

Without MiDaS (PyTorch unavailable), we implement a robust depth proxy
using gradient magnitude + blur + normalisation, which captures the
same structural information (objects are "closer" = higher contrast,
sharper edges, brighter gradient response).
"""

import cv2
import numpy as np
from dataclasses import dataclass
from typing import List, Tuple, Optional
from sklearn.ensemble        import GradientBoostingClassifier
from sklearn.neural_network  import MLPClassifier
from sklearn.preprocessing   import StandardScaler
from sklearn.pipeline        import Pipeline
from sklearn.model_selection import train_test_split
import pickle


@dataclass
class DetectedVehicle:
    cx:       float
    cy:       float
    w:        float
    h:        float
    class_id: str
    conf:     float
    depth:    float   # estimated relative depth [0=far, 1=near]


# ── Depth proxy (MiDaS substitute) ───────────────────────────────

def estimate_depth_map(bgr_img: np.ndarray) -> np.ndarray:
    """
    Estimate per-pixel relative depth from overhead RGB image.
    Depth proxy = normalised gradient magnitude + inverse brightness.

    Rationale: parked vehicles (closer objects) have:
      - higher edge contrast than ground
      - slightly different brightness from pavement
    Returns float32 map in [0, 1], 1 = closest/most prominent objects.
    """
    gray = cv2.cvtColor(bgr_img, cv2.COLOR_BGR2GRAY).astype(np.float32)

    # Sobel gradient magnitude
    gx = cv2.Sobel(gray, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(gray, cv2.CV_32F, 0, 1, ksize=3)
    grad_mag = np.sqrt(gx**2 + gy**2)

    # Laplacian for sharpness
    lap = np.abs(cv2.Laplacian(gray, cv2.CV_32F))

    # Combine: high gradient + high sharpness → close object
    depth_raw = grad_mag * 0.6 + lap * 0.4

    # Smooth to remove noise
    depth_smooth = cv2.GaussianBlur(depth_raw, (11, 11), 3)

    # Normalise per-frame to [0, 1]
    d_min, d_max = depth_smooth.min(), depth_smooth.max()
    if d_max > d_min:
        depth_norm = (depth_smooth - d_min) / (d_max - d_min)
    else:
        depth_norm = np.zeros_like(depth_smooth)

    return depth_norm.astype(np.float32)


def depth_at_bbox(depth_map: np.ndarray,
                  cx: float, cy: float,
                  w: float, h: float) -> float:
    """Mean depth value inside a bounding box."""
    x1 = max(0, int(cx - w / 2))
    y1 = max(0, int(cy - h / 2))
    x2 = min(depth_map.shape[1], int(cx + w / 2))
    y2 = min(depth_map.shape[0], int(cy + h / 2))
    patch = depth_map[y1:y2, x1:x2]
    return float(np.mean(patch)) if patch.size > 0 else 0.0


# ── Patch feature extraction (MDAD 4-channel: RGB + depth) ────────

def extract_patch_features(bgr_img: np.ndarray,
                            depth_map: np.ndarray,
                            cx: float, cy: float,
                            patch_size: int = 32) -> np.ndarray:
    """
    Extract a flattened 4-channel patch (RGB + depth) centred at (cx, cy).
    Resizes to patch_size × patch_size for fixed-length feature vector.
    """
    half = patch_size // 2
    x1 = max(0, int(cx) - half)
    y1 = max(0, int(cy) - half)
    x2 = min(bgr_img.shape[1], int(cx) + half)
    y2 = min(bgr_img.shape[0], int(cy) + half)

    bgr_patch   = bgr_img[y1:y2, x1:x2]
    depth_patch = depth_map[y1:y2, x1:x2]

    if bgr_patch.size == 0:
        return np.zeros(patch_size * patch_size * 4, dtype=np.float32)

    bgr_r   = cv2.resize(bgr_patch,   (patch_size, patch_size))
    depth_r = cv2.resize(depth_patch, (patch_size, patch_size))

    bgr_n   = bgr_r.astype(np.float32) / 255.0
    depth_n = depth_r.astype(np.float32)

    # Stack: (H, W, 4)
    four_ch = np.dstack([bgr_n, depth_n[:, :, np.newaxis]])
    return four_ch.flatten()


# ── Occupancy Classifier ──────────────────────────────────────────

class MDADClassifier:
    """
    Slot-level occupancy classifier using 4-channel (RGB + depth) patch features.
    Simulates the benefit of depth channel augmentation over RGB-only.
    """

    def __init__(self, use_depth: bool = True, patch_size: int = 24):
        self.use_depth  = use_depth
        self.patch_size = patch_size
        self.n_features = patch_size * patch_size * (4 if use_depth else 3)
        self.model      = Pipeline([
            ("scaler", StandardScaler()),
            ("clf",    MLPClassifier(
                hidden_layer_sizes=(256, 128, 64),
                activation="relu",
                max_iter=300,
                random_state=42,
                early_stopping=True,
                n_iter_no_change=15,
                alpha=1e-4)),
        ])
        self.trained = False

    def _featurise(self, bgr_img, depth_map, cx, cy):
        if self.use_depth:
            return extract_patch_features(bgr_img, depth_map, cx, cy,
                                          self.patch_size)
        else:
            # RGB-only
            half = self.patch_size // 2
            x1 = max(0, int(cx) - half); y1 = max(0, int(cy) - half)
            x2 = min(bgr_img.shape[1], int(cx) + half)
            y2 = min(bgr_img.shape[0], int(cy) + half)
            p  = bgr_img[y1:y2, x1:x2]
            if p.size == 0:
                return np.zeros(self.patch_size**2 * 3, dtype=np.float32)
            p = cv2.resize(p, (self.patch_size, self.patch_size))
            return p.astype(np.float32).flatten() / 255.0

    def train(self, annotations: list, img_dir: str):
        """Train classifier from dataset annotations."""
        import os
        X, y = [], []
        print(f"  [MDAD] Extracting patch features (use_depth={self.use_depth}) …")
        for ann in annotations:
            img_path = os.path.join(img_dir, "..", ann["img_path"])
            bgr = cv2.imread(img_path)
            if bgr is None:
                continue
            depth = estimate_depth_map(bgr) if self.use_depth else None
            for slot in ann["slots"]:
                feat = self._featurise(bgr, depth, slot["cx"], slot["cy"])
                X.append(feat)
                y.append(int(slot["occupied"]))

        X, y = np.array(X), np.array(y)
        print(f"  [MDAD] Training on {len(X)} samples …")
        X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2,
                                                    random_state=42,
                                                    stratify=y)
        self.model.fit(X_tr, y_tr)
        acc = self.model.score(X_te, y_te) * 100
        self.trained = True
        print(f"  [MDAD] Accuracy = {acc:.2f}%")
        return {"accuracy": float(acc)}

    def predict(self, bgr_img: np.ndarray,
                depth_map:  np.ndarray,
                cx: float, cy: float) -> Tuple[int, float]:
        """Predict occupancy (0/1) and confidence for one slot centre."""
        feat = self._featurise(bgr_img, depth_map, cx, cy).reshape(1, -1)
        prob = self.model.predict_proba(feat)[0]
        label = int(np.argmax(prob))
        return label, float(prob[label])

    def predict_all_slots(self,
                          bgr_img: np.ndarray,
                          slots: list,      # list of VirtualSlot or dict
                          ) -> List[Tuple[int, int, float]]:
        """
        Predict occupancy for all slots in image.
        Returns list of (slot_id, occupied:0/1, confidence).
        """
        depth = estimate_depth_map(bgr_img) if self.use_depth else None
        results = []
        for slot in slots:
            cx = slot.cx if hasattr(slot, "cx") else slot["cx"]
            cy = slot.cy if hasattr(slot, "cy") else slot["cy"]
            sid = slot.slot_id if hasattr(slot, "slot_id") else slot["slot_id"]
            label, conf = self.predict(bgr_img, depth, cx, cy)
            results.append((sid, label, conf))
        return results

    def save(self, path: str):
        with open(path, "wb") as f:
            pickle.dump({"model": self.model,
                         "use_depth": self.use_depth,
                         "patch_size": self.patch_size,
                         "trained": self.trained}, f)

    def load(self, path: str):
        with open(path, "rb") as f:
            d = pickle.load(f)
        self.model      = d["model"]
        self.use_depth  = d["use_depth"]
        self.patch_size = d["patch_size"]
        self.trained    = d["trained"]


def visualise_depth(bgr_img: np.ndarray,
                    depth_map: np.ndarray) -> np.ndarray:
    """Return side-by-side BGR image and depth map heatmap."""
    depth_uint8 = (depth_map * 255).astype(np.uint8)
    depth_color = cv2.applyColorMap(depth_uint8, cv2.COLORMAP_PLASMA)
    return np.hstack([bgr_img, depth_color])
