package dev.codecrafter.challenge.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record SetDailyChallengeRequest(
    @NotNull Long problemId,
    @NotNull LocalDate challengeDate,
    Integer bonusPoints
) {}
