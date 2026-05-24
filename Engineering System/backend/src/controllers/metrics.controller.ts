import { Request, Response } from "express";
import { getMetricsSummary } from "../services/metrics.service.js";

export async function getMetrics(req: Request, res: Response) {
  try {
    const summary = await getMetricsSummary();
    res.json(summary);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

