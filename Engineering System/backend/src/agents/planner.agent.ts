import { chatCompletion } from "../utils/llm.js";
import { PLANNER_SYSTEM } from "./prompts.js";

export interface PlanStep {
  step: number;
  action: string;
  agent: string;
}

export interface PlanResult {
  steps: PlanStep[];
  estimated_complexity: string;
  key_areas: string[];
}

export async function runPlannerAgent(issueDescription: string): Promise<PlanResult> {
  const prompt = `Issue to debug:\n\n${issueDescription}\n\nCreate a step-by-step debugging and resolution plan.`;
  const result = await chatCompletion(PLANNER_SYSTEM, prompt);
  return JSON.parse(result) as PlanResult;
}

