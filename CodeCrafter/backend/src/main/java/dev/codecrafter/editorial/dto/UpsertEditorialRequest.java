package dev.codecrafter.editorial.dto;

import jakarta.validation.constraints.NotBlank;

public record UpsertEditorialRequest(
    @NotBlank String contentMarkdown,
    boolean publish
) {}
