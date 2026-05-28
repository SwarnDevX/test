package dev.codecrafter.studyplan.dto;

public record StudyPlanProblemDto(
    Long problemId,
    int problemNumber,
    String problemTitle,
    String problemSlug,
    String difficulty,
    int orderIndex,
    String notes,
    boolean completed
) {}
