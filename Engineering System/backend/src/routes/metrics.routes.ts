import { Router } from "express";
import { getMetrics } from "../controllers/metrics.controller.js";

export const metricsRoutes = Router();
metricsRoutes.get("/", getMetrics);

