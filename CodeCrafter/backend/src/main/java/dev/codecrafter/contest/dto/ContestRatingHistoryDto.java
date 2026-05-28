package dev.codecrafter.contest.dto;

import java.time.Instant;

public record ContestRatingHistoryDto(
    Long contestId,
    String contestTitle,
    String contestSlug,
    int oldRating,
    int newRating,
    int delta,
    int rank,
    int participantCount,
    Instant createdAt
) {}
