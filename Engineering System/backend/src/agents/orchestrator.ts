import { Issue } from "../models/Issue.js";
import { AgentLog } from "../models/AgentLog.js";
import { Metric } from "../models/Metric.js";
import { Fix } from "../models/Fix.js";
import { runPlannerAgent } from "./planner.agent.js";
import { runDebugAgent } from "./debug.agent.js";
import { runFixAgent } from "./fix.agent.js";
import { runTestAgent } from "./test.agent.js";
import { runReviewerAgent } from "./reviewer.agent.js";
import { runInSandbox } from "../services/sandbox.service.js";
import { detectHallucination, assessConfidence } from "../utils/guardrails.js";
import { indexDocument } from "../utils/embeddings.js";
import { config } from "../config/index.js";
import { broadcastUpdate } from "../websocket/errorListener.js";

// ── Helper: Log agent actions to DB ──
async function logAgent(
  issueId: string,
  agent: string,
  action: string,
  input: any,
  output: any,
  durationMs: number
): Promise<void> {
  await AgentLog.create({ issueId, agent, action, input, output, durationMs });
  await Issue.findByIdAndUpdate(issueId, {
    $push: {
      agentLogs: { agent, action, timestamp: new Date(), data: { durationMs, summary: typeof output === "object" ? Object.keys(output) : "done" } },
    },
  });
}

// ══════════════════════════════════════════════════════════════
// MAIN SELF-HEALING PIPELINE
// Flow: Detect → Plan → Debug → Fix → Test → Review → Resolve
// ══════════════════════════════════════════════════════════════
export async function runSelfHealingPipeline(issueId: string): Promise<void> {
  const issue = await Issue.findById(issueId);
  if (!issue) throw new Error("Issue not found");

  const pipelineStart = Date.now();

  try {
    // ── STEP 1: PLANNING ──
    issue.status = "analyzing";
    await issue.save();
    broadcastUpdate(issueId, "analyzing", "🧩 Planner Agent creating debugging plan...");

    let t = Date.now();
    const plan = await runPlannerAgent(
      `Title: ${issue.title}\n\nError Logs:\n${issue.errorLogs}\n\nStack Trace:\n${issue.stackTrace}\n\nCode:\n${issue.codeContext}`
    );
    await logAgent(issueId, "planner", "create_plan", { title: issue.title }, plan, Date.now() - t);
    broadcastUpdate(issueId, "analyzing", `📋 Plan created: ${plan.steps.length} steps, complexity: ${plan.estimated_complexity}`);

    // ── STEP 2: DEBUG / ROOT CAUSE ANALYSIS ──
    t = Date.now();
    const debug = await runDebugAgent(issue.errorLogs, issue.stackTrace, issue.codeContext);
    await logAgent(issueId, "debug", "root_cause_analysis", {}, debug, Date.now() - t);

    issue.analysis = {
      rootCause: debug.root_cause,
      explanation: debug.explanation,
      confidenceScore: debug.confidence_score,
    };
    await issue.save();
    broadcastUpdate(issueId, "analyzing", `🔍 Root cause found (${debug.confidence_score}% confidence): ${debug.root_cause.slice(0, 100)}`);

    // If debug confidence is too low, flag it
    if (debug.confidence_score < 20) {
      await logAgent(issueId, "guardrails", "low_confidence_warning", {}, { score: debug.confidence_score }, 0);
      broadcastUpdate(issueId, "analyzing", "⚠️ Low confidence in root cause analysis");
    }

    // ── STEP 3: GENERATE FIX ──
    issue.status = "fixing";
    await issue.save();
    broadcastUpdate(issueId, "fixing", "🛠️ Fix Agent generating patch...");

    t = Date.now();
    const fix = await runFixAgent(debug.root_cause, issue.codeContext, debug.explanation);
    await logAgent(issueId, "fix", "generate_patch", {}, fix, Date.now() - t);

    // Hallucination check
    const hallucinations = detectHallucination(
      { fix: fix.fix, confidence_score: fix.confidence_score },
      issue.codeContext
    );
    if (hallucinations.length > 0) {
      await logAgent(issueId, "guardrails", "hallucination_check", {}, { warnings: hallucinations }, 0);
      broadcastUpdate(issueId, "fixing", `🛡️ Guardrails: ${hallucinations.length} potential hallucination(s) detected`);
    }

    issue.fix = {
      patch: fix.fix,
      explanation: fix.explanation,
      alternatives: fix.alternatives || [],
    };
    await issue.save();
    broadcastUpdate(issueId, "fixing", "✅ Fix generated");

    // Store fix record
    await Fix.create({
      issueId: issue._id,
      patch: fix.fix,
      explanation: fix.explanation,
      confidenceScore: fix.confidence_score,
    });

    // ── STEP 4: TEST ──
    issue.status = "testing";
    await issue.save();
    broadcastUpdate(issueId, "testing", "✅ Test Agent generating test cases...");

    t = Date.now();
    const tests = await runTestAgent(fix.fix, issue.codeContext, debug.root_cause);
    await logAgent(issueId, "test", "generate_tests", {}, { testCaseCount: tests.test_cases.length }, Date.now() - t);

    // Run tests in sandbox
    broadcastUpdate(issueId, "testing", "🧪 Running tests in sandbox...");
    t = Date.now();
    const sandboxResult = await runInSandbox(tests.test_code, fix.fix);
    await logAgent(issueId, "test", "sandbox_execution", {}, sandboxResult, Date.now() - t);

    issue.testResults = {
      passed: sandboxResult.success,
      output: sandboxResult.output,
      testCases: tests.test_cases.map((tc) => tc.name),
    };
    await issue.save();
    broadcastUpdate(issueId, "testing", sandboxResult.success ? "✅ All tests passed" : "❌ Tests failed");

    // ── STEP 5: CODE REVIEW ──
    issue.status = "reviewing";
    await issue.save();
    broadcastUpdate(issueId, "reviewing", "🧑‍⚖️ Reviewer Agent validating fix...");

    t = Date.now();
    const review = await runReviewerAgent(fix.fix, debug.root_cause, sandboxResult.output);
    await logAgent(issueId, "reviewer", "code_review", {}, review, Date.now() - t);

    issue.review = {
      approved: review.approved,
      comments: review.comments,
      securityIssues: review.security_issues || [],
    };

    // ── DETERMINE OUTCOME ──
    const finalConfidence = assessConfidence(
      debug.confidence_score,
      fix.confidence_score,
      sandboxResult.success,
      review.approved,
      hallucinations.length
    );

    if (review.approved && sandboxResult.success) {
      if (config.autoFixEnabled) {
        issue.status = "resolved";
        issue.humanApproved = false;
        broadcastUpdate(issueId, "resolved", `🚀 Auto-fix applied (confidence: ${finalConfidence}%)`);
      } else {
        issue.status = "reviewing";
        broadcastUpdate(issueId, "reviewing", `✅ Fix ready for human approval (confidence: ${finalConfidence}%)`);
      }
    } else {
      // Fallback to suggestion-only mode
      issue.status = "reviewing";
      broadcastUpdate(issueId, "reviewing",
        `⚠️ Fix needs review — Tests: ${sandboxResult.success ? "passed" : "failed"}, Review: ${review.approved ? "approved" : "rejected"}`
      );
    }

    await issue.save();

    // ── INDEX INTO RAG FOR FUTURE LEARNING ──
    try {
      await indexDocument(
        "errors",
        issueId,
        `ERROR: ${issue.errorLogs}\nSTACK: ${issue.stackTrace}\nROOT_CAUSE: ${debug.root_cause}\nFIX: ${fix.fix}`,
        { rootCause: debug.root_cause, status: issue.status, pattern: debug.error_pattern }
      );
    } catch {
      // Non-critical
    }

    // ── RECORD METRICS ──
    const elapsed = Date.now() - pipelineStart;
    await Metric.create({ type: "time_to_resolution", issueId: issue._id, value: elapsed });
    await Metric.create({ type: "confidence", issueId: issue._id, value: finalConfidence });
    await Metric.create({
      type: review.approved && sandboxResult.success ? "fix_success" : "fix_failure",
      issueId: issue._id,
      value: finalConfidence,
      metadata: { elapsed, hallucinations: hallucinations.length },
    });

  } catch (err: any) {
    console.error(`Pipeline error for issue ${issueId}:`, err.message);
    issue.status = "failed";
    issue.agentLogs.push({
      agent: "orchestrator",
      action: "pipeline_error",
      timestamp: new Date(),
      data: { error: err.message },
    });
    await issue.save();
    broadcastUpdate(issueId, "failed", `❌ Pipeline failed: ${err.message}`);
  }
}

