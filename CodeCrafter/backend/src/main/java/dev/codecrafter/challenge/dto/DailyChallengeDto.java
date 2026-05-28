package dev.codecrafter.challenge.dto;

import java.time.LocalDate;

public record DailyChallengeDto(
    Long id,
    LocalDate challengeDate,
    int bonusPoints,
    Long problemId,
    String problemSlug,
    String problemTitle,
    String problemDifficulty,
    boolean solvedToday
) {}
