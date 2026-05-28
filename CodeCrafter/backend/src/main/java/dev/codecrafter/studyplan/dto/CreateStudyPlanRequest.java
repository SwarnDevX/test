package dev.codecrafter.studyplan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateStudyPlanRequest(
    @NotBlank @Size(max = 80) String slug,
    @NotBlank @Size(max = 200) String title,
    String description,
    String icon,
    String difficulty,
    Integer estimatedDays,
    boolean publish
) {}
