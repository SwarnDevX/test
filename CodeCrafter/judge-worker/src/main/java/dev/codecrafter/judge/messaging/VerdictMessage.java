package dev.codecrafter.judge.messaging;

import java.io.Serializable;
import java.util.List;

public record VerdictMessage(
    Long submissionId,
    Long userId,
    String verdict,
    int testcasesPassed,
    int totalTestcases,
    Integer failingTestcaseIndex,
    Integer runtimeMs,
    Integer memoryKb,
    String compileError,
    List<TestCaseResultMessage> results
) implements Serializable {}
