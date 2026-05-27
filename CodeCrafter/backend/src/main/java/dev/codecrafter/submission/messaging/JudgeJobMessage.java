package dev.codecrafter.submission.messaging;

import java.io.Serializable;

public record JudgeJobMessage(
    Long submissionId,
    Long userId,
    Long problemId,
    String language,
    String sourceCode,
    int timeLimitMs,
    int memoryLimitMb
) implements Serializable {}
