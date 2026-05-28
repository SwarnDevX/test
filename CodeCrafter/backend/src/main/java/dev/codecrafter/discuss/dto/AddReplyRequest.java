package dev.codecrafter.discuss.dto;

import jakarta.validation.constraints.NotBlank;

public record AddReplyRequest(
    @NotBlank String contentMarkdown,
    Long parentId
) {}
