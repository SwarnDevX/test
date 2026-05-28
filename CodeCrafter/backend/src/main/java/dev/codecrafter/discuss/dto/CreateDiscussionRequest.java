package dev.codecrafter.discuss.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateDiscussionRequest(
    @NotBlank @Size(max = 300) String title,
    @NotBlank String contentMarkdown,
    String category
) {}
