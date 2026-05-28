package dev.codecrafter.solution.dto;

import java.time.Instant;

public record SolutionDto(
    Long id,
    Long problemId,
    String authorUsername,
    String authorAvatar,
    String title,
    String contentMarkdown,
    String language,
    int voteScore,
    int commentCount,
    Integer myVote,
    Instant createdAt,
    Instant updatedAt
) {}
