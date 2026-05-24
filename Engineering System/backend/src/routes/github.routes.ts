import { Router } from "express";
import { syncRepo, createPR } from "../controllers/github.controller.js";

export const githubRoutes = Router();
githubRoutes.post("/sync", syncRepo);
githubRoutes.post("/pr/:issueId", createPR);

