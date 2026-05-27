package dev.codecrafter.submission.messaging;

import java.io.Serializable;

public record TestCaseResultMessage(
    int caseIndex,
    String verdict,
    String actualOutput,
    String expectedOutput,
    String stderr,
    long runtimeMs
) implements Serializable {}
