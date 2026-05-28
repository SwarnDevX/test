package dev.codecrafter.studyplan.dto;

public record StudyPlanSummaryDto(
    Long id,
    String slug,
    String title,
    String description,
    String icon,
    String difficulty,
    int problemCount,
    Integer estimatedDays,
    int completedCount,
    int progressPercent
) {}
