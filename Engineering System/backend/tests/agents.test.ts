import { describe, it, expect } from "vitest";
import { parseLogs, extractErrors } from "../src/services/logParser.service.js";
import { computeClusterId } from "../src/services/errorCluster.service.js";
import { checkSecureCode, detectHallucination } from "../src/utils/guardrails.js";

describe("Log Parser", () => {
  it("should parse standard error log", () => {
    const raw = `[2024-01-15T10:30:00Z] ERROR: Cannot read property 'name' of undefined
    at getUserName (src/services/user.ts:42:15)
    at processRequest (src/controllers/api.ts:18:10)
[2024-01-15T10:30:01Z] INFO: Request completed`;

    const logs = parseLogs(raw);
    expect(logs.length).toBe(2);
    expect(logs[0].level).toBe("ERROR");
    expect(logs[0].file).toBe("src/services/user.ts");
    expect(logs[0].line).toBe(42);
    expect(logs[1].level).toBe("INFO");
  });

  it("should extract only errors", () => {
    const logs = parseLogs("[2024-01-15] ERROR: fail\n[2024-01-15] INFO: ok\n[2024-01-15] FATAL: crash");
    const errors = extractErrors(logs);
    expect(errors.length).toBe(2);
  });
});

describe("Error Clustering", () => {
  it("should generate same cluster ID for similar traces", () => {
    const trace1 = "Error at foo (bar.js:10:5)\n  at baz (qux.js:20:3)";
    const trace2 = "Error at foo (bar.js:15:8)\n  at baz (qux.js:25:3)";
    expect(computeClusterId(trace1)).toBe(computeClusterId(trace2));
  });

  it("should generate different IDs for different traces", () => {
    const trace1 = "Error at foo (bar.js:10:5)";
    const trace2 = "Error at completely_different (other.js:10:5)";
    expect(computeClusterId(trace1)).not.toBe(computeClusterId(trace2));
  });
});

describe("Guardrails", () => {
  it("should detect eval usage", () => {
    const issues = checkSecureCode("const result = eval(userInput)");
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0]).toContain("eval");
  });

  it("should detect child_process usage", () => {
    const issues = checkSecureCode("const { exec } = require('child_process')");
    expect(issues.length).toBeGreaterThan(0);
  });

  it("should pass clean code", () => {
    const issues = checkSecureCode("const x = 1 + 2; console.log(x);");
    expect(issues.length).toBe(0);
  });

  it("should detect hallucinated functions", () => {
    const warnings = detectHallucination(
      { fix: "const result = someUnknownFunction(data);", confidence_score: 50 },
      "function processData(data) { return data; }"
    );
    expect(warnings.length).toBeGreaterThan(0);
  });
});

