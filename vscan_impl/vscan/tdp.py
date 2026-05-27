"""
VSCAN Module 3 — Temporal Dwell Prediction (TDP)
==================================================
Predicts when an occupied parking slot will become free,
framed as a survival analysis problem.

Architecture:
  - Feature extraction from occupancy context
  - Log-normal survival distribution fitting per slot
  - Multi-Layer Perceptron (scikit-learn) as LSTM surrogate
    (PyTorch not available; MLP approximates LSTM's temporal learning)
  - Output: T_med (median departure) and T_80 (80th percentile)
"""

import numpy as np
import json
import pickle
import os
from sklearn.neural_network import MLPRegressor
from sklearn.preprocessing   import StandardScaler
from sklearn.pipeline        import Pipeline
from sklearn.model_selection import train_test_split
from dataclasses import dataclass
from typing import List, Dict, Tuple, Optional


DAYS_OF_WEEK   = 7
VEHICLE_CLASSES = ["V1", "V2", "V3", "V4", "V5"]

# Historical average dwell times (minutes) by vehicle class — seed values
DWELL_PRIORS = {
    "V1": {"mu": 25.0,  "sigma": 18.0},
    "V2": {"mu": 12.0,  "sigma": 8.0},
    "V3": {"mu": 55.0,  "sigma": 40.0},
    "V4": {"mu": 65.0,  "sigma": 45.0},
    "V5": {"mu": 90.0,  "sigma": 60.0},
}


@dataclass
class DwellFeatures:
    entry_time_min:    float   # minutes since midnight
    elapsed_min:       float   # how long parked so far
    vehicle_class:     str
    day_of_week:       int     # 0=Mon … 6=Sun
    hist_mu:           float   # historical mean dwell for this slot+context
    hist_sigma:        float   # historical std dwell


@dataclass
class DwellPrediction:
    slot_id:   int
    t_med:     float   # median departure (minutes from now)
    t_80:      float   # 80th percentile departure
    label:     str     # "Free soon" / "Extended stay"


def _encode_features(feat: DwellFeatures) -> np.ndarray:
    """
    Encode DwellFeatures into a 1-D numpy vector.

    Features:
      [0]   sin(2π·entry_time/1440)    — cyclical time of day
      [1]   cos(2π·entry_time/1440)
      [2]   elapsed_min / 120          — elapsed fraction (cap 2hr)
      [3-7] one-hot vehicle class       (V1..V5)
      [8-14] one-hot day-of-week       (Mon..Sun)
      [15]  hist_mu / 120
      [16]  hist_sigma / 60
    """
    t = feat.entry_time_min
    sin_t = np.sin(2 * np.pi * t / 1440)
    cos_t = np.cos(2 * np.pi * t / 1440)
    elapsed_norm = np.clip(feat.elapsed_min / 120.0, 0, 1)

    veh_onehot = np.zeros(len(VEHICLE_CLASSES))
    if feat.vehicle_class in VEHICLE_CLASSES:
        veh_onehot[VEHICLE_CLASSES.index(feat.vehicle_class)] = 1.0

    dow_onehot = np.zeros(DAYS_OF_WEEK)
    dow_onehot[feat.day_of_week % DAYS_OF_WEEK] = 1.0

    mu_norm    = feat.hist_mu    / 120.0
    sigma_norm = feat.hist_sigma / 60.0

    return np.array([sin_t, cos_t, elapsed_norm,
                     *veh_onehot, *dow_onehot,
                     mu_norm, sigma_norm], dtype=np.float32)


def _lognormal_quantile(mu_log, sigma_log, q):
    """Quantile of log-normal: exp(mu + sigma * Φ^-1(q))."""
    from scipy.stats import norm
    return np.exp(mu_log + sigma_log * norm.ppf(q))


class TDPModel:
    """
    Temporal Dwell Predictor.
    Predicts log(dwell_time) using an MLP, then wraps in log-normal distribution.
    """

    def __init__(self):
        self.pipe_mu    = Pipeline([
            ("scaler", StandardScaler()),
            ("mlp",    MLPRegressor(hidden_layer_sizes=(64, 64, 32),
                                    activation="relu",
                                    max_iter=500,
                                    random_state=42,
                                    early_stopping=True,
                                    n_iter_no_change=15)),
        ])
        self.pipe_sigma = Pipeline([
            ("scaler", StandardScaler()),
            ("mlp",    MLPRegressor(hidden_layer_sizes=(32, 16),
                                    activation="relu",
                                    max_iter=300,
                                    random_state=7,
                                    early_stopping=True,
                                    n_iter_no_change=15)),
        ])
        self.trained = False

    def _generate_synthetic_samples(self, n: int = 6000
                                     ) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
        """
        Simulate (features, log_mu, log_sigma) training samples.
        Dwell time is drawn from a log-normal with class-specific parameters,
        modulated by time-of-day and day-of-week effects.
        """
        X, y_mu, y_sig = [], [], []
        for _ in range(n):
            cls       = np.random.choice(VEHICLE_CLASSES)
            prior     = DWELL_PRIORS[cls]
            tod       = np.random.uniform(6 * 60, 22 * 60)   # 6 AM – 10 PM
            dow       = np.random.randint(0, 7)
            elapsed   = np.random.uniform(0, prior["mu"])

            # Time-of-day modulation
            tod_factor = 1.0 + 0.3 * np.sin(np.pi * (tod - 6 * 60) / (16 * 60))
            # Weekend modulation
            wkend_factor = 1.25 if dow >= 5 else 1.0

            true_mu    = prior["mu"]    * tod_factor * wkend_factor
            true_sigma = prior["sigma"] * tod_factor

            # Log-normal parameters
            var_log  = np.log(1 + (true_sigma / true_mu) ** 2)
            mu_log   = np.log(true_mu) - var_log / 2
            sig_log  = np.sqrt(var_log)

            feat = DwellFeatures(
                entry_time_min=tod,
                elapsed_min=elapsed,
                vehicle_class=cls,
                day_of_week=dow,
                hist_mu=true_mu,
                hist_sigma=true_sigma)
            X.append(_encode_features(feat))
            y_mu.append(mu_log)
            y_sig.append(sig_log)

        return np.array(X), np.array(y_mu), np.array(y_sig)

    def train(self, annotations: Optional[list] = None, n_synthetic: int = 6000):
        """
        Train the TDP model.
        Uses real annotations (if provided) augmented with synthetic samples.
        """
        print("  [TDP] Generating training samples …")
        X_syn, y_mu_syn, y_sig_syn = self._generate_synthetic_samples(n_synthetic)

        # Build real samples from annotations
        X_real, y_mu_real, y_sig_real = [], [], []
        if annotations:
            for ann in annotations:
                for veh in ann.get("vehicles", []):
                    if not veh["occupied"]:
                        continue
                    cls   = veh["class_id"]
                    prior = DWELL_PRIORS.get(cls, DWELL_PRIORS["V3"])
                    # Simulate actual dwell from log-normal
                    var_log = np.log(1 + (prior["sigma"] / prior["mu"]) ** 2)
                    mu_log  = np.log(prior["mu"]) - var_log / 2
                    sig_log = np.sqrt(var_log)
                    dwell   = np.random.lognormal(mu_log, sig_log)
                    tod     = veh.get("entry_time", 480.0)
                    feat    = DwellFeatures(
                        entry_time_min=float(tod),
                        elapsed_min=float(dwell * 0.3),
                        vehicle_class=cls,
                        day_of_week=int(tod // 1440) % 7,
                        hist_mu=prior["mu"],
                        hist_sigma=prior["sigma"])
                    X_real.append(_encode_features(feat))
                    y_mu_real.append(mu_log)
                    y_sig_real.append(sig_log)

        if X_real:
            X     = np.vstack([X_syn, np.array(X_real)])
            y_mu  = np.concatenate([y_mu_syn,  np.array(y_mu_real)])
            y_sig = np.concatenate([y_sig_syn, np.array(y_sig_real)])
        else:
            X, y_mu, y_sig = X_syn, y_mu_syn, y_sig_syn

        X_tr, X_te, ym_tr, ym_te, ys_tr, ys_te = train_test_split(
            X, y_mu, y_sig, test_size=0.2, random_state=42)

        print(f"  [TDP] Training μ-model on {len(X_tr)} samples …")
        self.pipe_mu.fit(X_tr, ym_tr)
        mu_rmse = np.sqrt(np.mean((self.pipe_mu.predict(X_te) - ym_te) ** 2))

        print(f"  [TDP] Training σ-model …")
        self.pipe_sigma.fit(X_tr, ys_tr)
        sig_rmse = np.sqrt(np.mean((self.pipe_sigma.predict(X_te) - ys_te) ** 2))

        self.trained = True
        print(f"  [TDP] Done. μ-RMSE={mu_rmse:.4f}, σ-RMSE={sig_rmse:.4f}")
        return {"mu_rmse": float(mu_rmse), "sig_rmse": float(sig_rmse)}

    def predict(self,
                slot_id: int,
                feat: DwellFeatures) -> DwellPrediction:
        """Predict T_med and T_80 for one occupied slot."""
        if not self.trained:
            # Fallback: use prior
            prior  = DWELL_PRIORS.get(feat.vehicle_class, DWELL_PRIORS["V3"])
            t_med  = max(0.0, prior["mu"] - feat.elapsed_min)
            t_80   = t_med * 1.6
        else:
            x_in  = _encode_features(feat).reshape(1, -1)
            mu_p  = self.pipe_mu.predict(x_in)[0]
            sig_p = max(0.05, self.pipe_sigma.predict(x_in)[0])
            # Convert log-normal params back to minutes
            t_med_full = np.exp(mu_p)
            t_80_full  = _lognormal_quantile(mu_p, sig_p, 0.80)
            # Subtract elapsed
            t_med = max(0.0, t_med_full - feat.elapsed_min)
            t_80  = max(0.0, t_80_full  - feat.elapsed_min)

        label = "Free soon" if t_med < 15 else "Extended stay"
        return DwellPrediction(slot_id=slot_id, t_med=t_med,
                               t_80=t_80, label=label)

    def save(self, path: str):
        with open(path, "wb") as f:
            pickle.dump({"pipe_mu": self.pipe_mu,
                         "pipe_sigma": self.pipe_sigma,
                         "trained": self.trained}, f)

    def load(self, path: str):
        with open(path, "rb") as f:
            d = pickle.load(f)
        self.pipe_mu    = d["pipe_mu"]
        self.pipe_sigma = d["pipe_sigma"]
        self.trained    = d["trained"]


def evaluate_tdp(model: TDPModel, n_eval: int = 500) -> dict:
    """
    Evaluate TDP on synthetic ground-truth.
    Generates samples with known actual dwell, measures RMSE & MAE.
    """
    errors = []
    for _ in range(n_eval):
        cls   = np.random.choice(VEHICLE_CLASSES)
        prior = DWELL_PRIORS[cls]
        var_log = np.log(1 + (prior["sigma"] / prior["mu"]) ** 2)
        mu_log  = np.log(prior["mu"]) - var_log / 2
        sig_log = np.sqrt(var_log)
        actual_dwell = np.clip(np.random.lognormal(mu_log, sig_log), 2, 240)
        elapsed      = np.random.uniform(0, min(actual_dwell * 0.5, 30))
        remaining    = actual_dwell - elapsed

        tod  = np.random.uniform(6 * 60, 22 * 60)
        feat = DwellFeatures(
            entry_time_min=tod,
            elapsed_min=elapsed,
            vehicle_class=cls,
            day_of_week=int(tod // 1440) % 7,
            hist_mu=prior["mu"],
            hist_sigma=prior["sigma"])
        pred = model.predict(slot_id=0, feat=feat)
        errors.append(abs(pred.t_med - remaining))

    errors = np.array(errors)
    return {
        "mae_minutes":  float(np.mean(errors)),
        "rmse_minutes": float(np.sqrt(np.mean(errors ** 2))),
        "n_eval":       n_eval,
    }
