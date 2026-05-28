package dev.codecrafter.contest.dto;

public record ContestProblemDto(
    Long problemId,
    String alias,
    int orderIndex,
    int points,
    String title,
    String slug,
    String difficulty,
    boolean solved,
    int wrongAttempts
) {}
