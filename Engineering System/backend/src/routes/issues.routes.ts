import { Router } from "express";
import { getIssues, getIssueById, approveIssue, rejectIssue } from "../controllers/issues.controller.js";

export const issueRoutes = Router();
issueRoutes.get("/", getIssues);
issueRoutes.get("/:id", getIssueById);
issueRoutes.post("/:id/approve", approveIssue);
issueRoutes.post("/:id/reject", rejectIssue);

