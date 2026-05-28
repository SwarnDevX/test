package dev.codecrafter.contest.dto;

public record LeaderboardEntryDto(
    int rank,
    Long userId,
    String username,
    String avatarUrl,
    int solved,
    int penaltySecs,
    Integer ratingChange
) {}
