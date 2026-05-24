import { Request, Response } from "express";
import { Issue } from "../models/Issue.js";
import { parseLogs, extractErrors } from "../services/logParser.service.js";
import { computeClusterId } from "../services/errorCluster.service.js";
import { runSelfHealingPipeline } from "../agents/orchestrator.js";

export async function ingestError(req: Request, res: Response) {
  try {
    const { title, errorLogs, stackTrace, codeContext, repoUrl, filePath } = req.body;

    if (!title && !errorLogs && !stackTrace) {
      return res.status(400).json({ error: "At least title, errorLogs, or stackTrace is required" });
    }

    const clusterId = computeClusterId(stackTrace || errorLogs || "");

    // Check for existing similar issue
    const existing = await Issue.findOne({
      clusterId,
      status: { $in: ["analyzing", "fixing", "testing", "reviewing"] },
    });

    if (existing) {
      return res.status(200).json({
        issueId: existing._id,
        status: existing.status,
        message: "Similar issue already being processed",
        clusterId,
      });
    }

    const issue = await Issue.create({
      title: title || "Untitled Error",
      errorLogs: errorLogs || "",
      stackTrace: stackTrace || "",
      codeContext: codeContext || "",
      repoUrl,
      filePath,
      clusterId,
    });

    // Start the self-healing pipeline asynchronously
    runSelfHealingPipeline(issue._id.toString()).catch((err) =>
      console.error("Pipeline error:", err.message)
    );

    res.status(201).json({
      issueId: issue._id,
      status: "processing",
      message: "Issue submitted. Self-healing pipeline started.",
      clusterId,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function ingestLogs(req: Request, res: Response) {
  try {
    const { raw } = req.body;
    if (!raw) return res.status(400).json({ error: "raw log text is required" });

    const parsed = parseLogs(raw);
    const errors = extractErrors(parsed);

    const issueIds: string[] = [];
    for (const err of errors) {
      const clusterId = computeClusterId(err.stack || err.message);
      const issue = await Issue.create({
        title: err.message.slice(0, 120),
        errorLogs: err.message,
        stackTrace: err.stack || "",
        filePath: err.file,
        clusterId,
      });
      runSelfHealingPipeline(issue._id.toString()).catch(console.error);
      issueIds.push(issue._id.toString());
    }

    res.json({
      totalParsed: parsed.length,
      errorsFound: errors.length,
      issuesCreated: issueIds,
      parsedLogs: parsed,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

