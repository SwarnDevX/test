package dev.codecrafter.contest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddContestProblemRequest(
    @NotNull Long problemId,
    @NotBlank String alias,
    Integer orderIndex,
    Integer points
) {}
