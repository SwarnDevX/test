import { Router } from "express";
import { ingestError, ingestLogs } from "../controllers/ingest.controller.js";

export const ingestRoutes = Router();
ingestRoutes.post("/error", ingestError);
ingestRoutes.post("/logs", ingestLogs);

