import { z } from "zod";

// ── Schema Validation ──
export const FixOutputSchema = z.object({
  root_cause: z.string().min(1),
  explanation: z.string().min(1),
  fix: z.string().min(1),
  test_cases: z.array(z.string()),
  confidence_score: z.number().min(0).max(100),
  side_effects: z.array(z.string()).optional(),
});

export type FixOutput = z.infer<typeof FixOutputSchema>;

export function validateFixOutput(raw: string): FixOutput {
  const parsed = JSON.parse(raw);
  return FixOutputSchema.parse(parsed);
}

// ── Hallucination Detection ──
const BUILTIN_NAMES = new Set([
  "console", "require", "parseInt", "parseFloat", "JSON", "Math",
  "Array", "Object", "String", "Number", "Date", "Promise",
  "setTimeout", "setInterval", "clearTimeout", "clearInterval",
  "Buffer", "process", "Error", "TypeError", "RangeError",
  "Map", "Set", "RegExp", "Symbol", "Proxy", "Reflect",
  "encodeURIComponent", "decodeURIComponent", "fetch", "URL",
  "module", "exports", "global", "globalThis", "undefined", "null",
  "true", "false", "NaN", "Infinity", "isNaN", "isFinite",
  "async", "await", "return", "throw", "new", "delete", "typeof",
  "if", "else", "for", "while", "switch", "case", "break", "continue",
  "try", "catch", "finally", "function", "class", "const", "let", "var",
]);

export function detectHallucination(output: { fix: string; confidence_score: number }, codeContext: string): string[] {
  const warnings: string[] = [];

  // Check if fix references functions not in context
  const functionCalls = output.fix.match(/\b([a-zA-Z_$][\w$]*)\s*\(/g) || [];
  for (const call of functionCalls) {
    const fnName = call.replace("(", "").trim();
    if (fnName.length > 3 && !codeContext.includes(fnName) && !BUILTIN_NAMES.has(fnName)) {
      warnings.push(`Possibly hallucinated function: ${fnName}`);
    }
  }

  if (output.confidence_score < 30) {
    warnings.push("Very low confidence — high hallucination risk");
  }

  return warnings;
}

// ── Security Checks ──
export function checkSecureCode(code: string): string[] {
  const issues: string[] = [];
  const checks: Array<[RegExp, string]> = [
    [/\beval\s*\(/, "Uses eval() — code injection risk"],
    [/child_process/, "Uses child_process — potential remote code execution"],
    [/\brm\s+-rf\b/, "Destructive shell command detected"],
    [/DROP\s+TABLE/i, "SQL DROP TABLE detected"],
    [/exec\s*\([^)]*\$\{/, "Possible command injection via template literal"],
    [/innerHTML\s*=/, "Direct innerHTML assignment — XSS risk"],
    [/document\.write\s*\(/, "document.write() — XSS risk"],
    [/process\.env\.\w+.*(?:res|response)\.(?:send|json)/, "Possible environment variable leak"],
    [/new\s+Function\s*\(/, "Dynamic function creation — code injection risk"],
    [/__proto__|constructor\s*\[/, "Prototype pollution risk"],
  ];

  for (const [pattern, message] of checks) {
    if (pattern.test(code)) issues.push(message);
  }
  return issues;
}

// ── Confidence Assessment ──
export function assessConfidence(
  debugConfidence: number,
  fixConfidence: number,
  testsPassed: boolean,
  reviewApproved: boolean,
  hallucinationWarnings: number
): number {
  let score = (debugConfidence * 0.3 + fixConfidence * 0.3);
  if (testsPassed) score += 20;
  if (reviewApproved) score += 15;
  score -= hallucinationWarnings * 5;
  return Math.max(0, Math.min(100, Math.round(score)));
}

