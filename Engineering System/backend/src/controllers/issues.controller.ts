import { Request, Response } from "express";
import { Issue } from "../models/Issue.js";
import { AgentLog } from "../models/AgentLog.js";
import { createPullRequest } from "../services/github.service.js";
import { recordFeedback } from "../services/metrics.service.js";

export async function getIssues(req: Request, res: Response) {
  try {
    const { status, page = "1", limit = "20", search } = req.query;
    const filter: any = {};
    if (status) filter.status = status;
    if (search) filter.title = { $regex: search, $options: "i" };

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [issues, total] = await Promise.all([
      Issue.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit as string)).lean(),
      Issue.countDocuments(filter),
    ]);

    res.json({ issues, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getIssueById(req: Request, res: Response) {
  try {
    const issue = await Issue.findById(req.params.id).lean();
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    const agentLogs = await AgentLog.find({ issueId: issue._id }).sort({ createdAt: 1 }).lean();
    res.json({ issue, agentLogs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function approveIssue(req: Request, res: Response) {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    issue.humanApproved = true;
    issue.status = "resolved";
    await issue.save();
    await recordFeedback(issue._id.toString(), true);

    // Try to create a PR if GitHub is configured and we have a file path
    let prUrl: string | undefined;
    if (issue.fix?.patch && issue.filePath) {
      try {
        prUrl = await createPullRequest(
          issue.title,
          `**Root Cause:** ${issue.analysis?.rootCause || "N/A"}\n\n**Fix:** ${issue.fix.explanation}`,
          issue.fix.patch,
          issue.filePath
        );
      } catch { /* GitHub not configured */ }
    }

    res.json({ status: "approved", prUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function rejectIssue(req: Request, res: Response) {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ error: "Issue not found" });

    issue.humanApproved = false;
    issue.status = "failed";
    issue.agentLogs.push({ agent: "human", action: "rejected", timestamp: new Date(), data: { reason: req.body.reason || "Rejected by reviewer" } });
    await issue.save();
    await recordFeedback(issue._id.toString(), false);

    res.json({ status: "rejected" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

