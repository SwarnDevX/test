package dev.codecrafter.solution.dto;

import jakarta.validation.constraints.NotBlank;

public record AddCommentRequest(
    @NotBlank String contentMarkdown,
    Long parentId
) {}
