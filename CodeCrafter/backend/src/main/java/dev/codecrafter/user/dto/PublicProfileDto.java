package dev.codecrafter.user.dto;

import java.time.Instant;
import java.util.List;

public record PublicProfileDto(
    Long id,
    String username,
    String displayName,
    String avatarUrl,
    String bio,
    String location,
    String company,
    String school,
    String githubUrl,
    String linkedinUrl,
    String twitterUrl,
    List<String> preferredLanguages,
    StatsDto stats,
    Instant memberSince
) {
    public record StatsDto(
        int easySolved,
        int mediumSolved,
        int hardSolved,
        int totalSolved,
        int currentStreak,
        int longestStreak,
        long ranking,
        long reputation
    ) {}
}
