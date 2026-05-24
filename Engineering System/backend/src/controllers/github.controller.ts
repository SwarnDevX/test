import { Request, Response } from "express";
import { getRepoTree, getFileContent, createPullRequest } from "../services/github.service.js";
import { indexRepository } from "../services/rag.service.js";
import { Issue } from "../models/Issue.js";

export async function syncRepo(req: Request, res: Response) {
  try {
    const tree = await getRepoTree();
    const codeFiles = tree.filter((f: string) => /\.(ts|tsx|js|jsx|py|java|go|rs)$/.test(f));

    const files: Array<{ path: string; content: string }> = [];
    for (const path of codeFiles.slice(0, 200)) {
      try {
        const content = await getFileContent(path);
        files.push({ path, content });
      } catch { /* skip unreadable files */ }
    }

    const indexed = await indexRepository(files);
    res.json({ totalFiles: codeFiles.length, fetched: files.length, indexed });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function createPR(req: Request, res: Response) {
  try {
    const issue = await Issue.findById(req.params.issueId);
    if (!issue || !issue.fix?.patch || !issue.filePath) {
      return res.status(400).json({ error: "No fix or file path available for this issue" });
    }

    const prUrl = await createPullRequest(
      issue.title,
      `**Root Cause:** ${issue.analysis?.rootCause}\n\n**Explanation:** ${issue.fix.explanation}`,
      issue.fix.patch,
      issue.filePath
    );

    res.json({ prUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

