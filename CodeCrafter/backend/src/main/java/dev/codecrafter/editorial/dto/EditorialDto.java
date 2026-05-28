package dev.codecrafter.editorial.dto;

import java.time.Instant;

public record EditorialDto(
    Long id,
    Long problemId,
    String authorUsername,
    String contentMarkdown,
    boolean isPublished,
    Instant updatedAt
) {}
