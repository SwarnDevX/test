import { chatCompletion } from "../utils/llm.js";
import { DEBUG_SYSTEM } from "./prompts.js";
import { hybridSearch } from "../utils/embeddings.js";

export interface DebugResult {
  root_cause: string;
  explanation: string;
  affected_files: string[];
  error_pattern: string;
  confidence_score: number;
}

export async function runDebugAgent(
  errorLogs: string,
  stackTrace: string,
  codeContext: string
): Promise<DebugResult> {
  // RAG: search for similar past errors and related code
  let ragContext = "";
  try {
    const similarErrors = await hybridSearch("errors", `${errorLogs}\n${stackTrace}`, 3);
    const similarCode = await hybridSearch("codebase", stackTrace, 3);

    if (similarErrors.length > 0) {
      ragContext += "\n\n--- Similar Past Errors (from knowledge base) ---\n";
      ragContext += similarErrors.map((e) => e.document).join("\n---\n");
    }
    if (similarCode.length > 0) {
      ragContext += "\n\n--- Related Code (from knowledge base) ---\n";
      ragContext += similarCode.map((c) => `[${c.metadata.path || "unknown"}]\n${c.document}`).join("\n---\n");
    }
  } catch {
    // RAG unavailable, proceed without it
  }

  const prompt = `Error Logs:\n${errorLogs}\n\nStack Trace:\n${stackTrace}\n\nCode Context:\n${codeContext}${ragContext}\n\nAnalyze and find the root cause.`;
  const result = await chatCompletion(DEBUG_SYSTEM, prompt);
  return JSON.parse(result) as DebugResult;
}

