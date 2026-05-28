package dev.codecrafter.solution.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSolutionRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank String contentMarkdown,
    String language
) {}
