import { chatCompletion } from "../utils/llm.js";
import { FIX_SYSTEM } from "./prompts.js";

export interface FixResult {
  fix: string;
  explanation: string;
  alternatives: string[];
  confidence_score: number;
  side_effects: string[];
  breaking_changes: boolean;
}

export async function runFixAgent(
  rootCause: string,
  codeContext: string,
  explanation: string
): Promise<FixResult> {
  const prompt = `Root Cause:\n${rootCause}\n\nExplanation:\n${explanation}\n\nCode to Fix:\n${codeContext}\n\nGenerate a minimal, safe fix. Do NOT rewrite the entire code.`;
  const result = await chatCompletion(FIX_SYSTEM, prompt);
  return JSON.parse(result) as FixResult;
}

