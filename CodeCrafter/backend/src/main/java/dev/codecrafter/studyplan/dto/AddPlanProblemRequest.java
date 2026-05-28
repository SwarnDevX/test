package dev.codecrafter.studyplan.dto;

import jakarta.validation.constraints.NotNull;

public record AddPlanProblemRequest(
    @NotNull Long problemId,
    Integer orderIndex,
    String notes
) {}
