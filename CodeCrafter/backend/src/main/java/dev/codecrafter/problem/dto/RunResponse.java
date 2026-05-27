package dev.codecrafter.problem.dto;

import java.util.List;

public record RunResponse(
    String verdict,           // ACCEPTED | WRONG_ANSWER | COMPILE_ERROR | RUNTIME_ERROR | TIME_LIMIT_EXCEEDED | INTERNAL_ERROR
    List<TestResult> results,
    String compileError       // non-null only when COMPILE_ERROR
) {
    public record TestResult(
        int caseIndex,
        String input,
        String expectedOutput,
        String actualOutput,
        String stderr,
        Long runtimeMs,
        String verdict        // per-case verdict
    ) {}
}
