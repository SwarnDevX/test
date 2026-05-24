import { Router } from "express";
import { ingestRoutes } from "./ingest.routes.js";
import { issueRoutes } from "./issues.routes.js";
import { githubRoutes } from "./github.routes.js";
import { metricsRoutes } from "./metrics.routes.js";
import { apiLimiter } from "../middleware/rateLimit.js";

export const routes = Router();

routes.use(apiLimiter);
routes.use("/ingest", ingestRoutes);
routes.use("/issues", issueRoutes);
routes.use("/github", githubRoutes);
routes.use("/metrics", metricsRoutes);

// Health check
routes.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), uptime: process.uptime() });
});

