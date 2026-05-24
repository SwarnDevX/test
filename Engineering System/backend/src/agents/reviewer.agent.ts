import { chatCompletion } from "../utils/llm.js";
import { REVIEWER_SYSTEM } from "./prompts.js";
import { checkSecureCode } from "../utils/guardrails.js";

export interface ReviewResult {
  approved: boolean;
  comments: string;
  security_issues: string[];
  performance_issues: string[];
  suggestions: string[];
  confidence_score: number;
  severity: string;
}

export async function runReviewerAgent(
  fix: string,
  rootCause: string,
  testOutput: string
): Promise<ReviewResult> {
  // Static security analysis first
  const staticIssues = checkSecureCode(fix);

  const prompt = `Proposed Fix:\n${fix}\n\nRoot Cause:\n${rootCause}\n\nTest Results:\n${testOutput}\n\nStatic Analysis Findings:\n${staticIssues.length > 0 ? staticIssues.join("\n") : "None"}\n\nReview this fix thoroughly.`;

  const result = await chatCompletion(REVIEWER_SYSTEM, prompt);
  const parsed: ReviewResult = JSON.parse(result);

  // Merge static analysis findings
  parsed.security_issues = [...new Set([...parsed.security_issues, ...staticIssues])];
  if (staticIssues.length > 0) {
    parsed.approved = false;
    parsed.severity = "critical";
  }

  return parsed;
}

