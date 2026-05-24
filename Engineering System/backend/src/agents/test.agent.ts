import { chatCompletion } from "../utils/llm.js";
import { TEST_SYSTEM } from "./prompts.js";

export interface TestCase {
  name: string;
  description: string;
  type: string;
}

export interface TestResult {
  test_code: string;
  test_cases: TestCase[];
  coverage_areas: string[];
}

export async function runTestAgent(
  fix: string,
  originalCode: string,
  rootCause: string
): Promise<TestResult> {
  const prompt = `Original Code:\n${originalCode}\n\nApplied Fix:\n${fix}\n\nRoot Cause Being Fixed:\n${rootCause}\n\nGenerate comprehensive test cases to validate this fix.`;
  const result = await chatCompletion(TEST_SYSTEM, prompt);
  return JSON.parse(result) as TestResult;
}

