package dev.codecrafter.studyplan.dto;

import java.util.List;

public record StudyPlanDetailDto(
    Long id,
    String slug,
    String title,
    String description,
    String icon,
    String difficulty,
    int problemCount,
    Integer estimatedDays,
    int completedCount,
    int progressPercent,
    List<StudyPlanProblemDto> problems
) {}
