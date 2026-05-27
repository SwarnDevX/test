package dev.codecrafter.user.dto;

import java.time.Instant;
import java.util.List;

public record UserProfileDto(
    Long id,
    String email,
    String username,
    boolean emailVerified,
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
    Instant createdAt
) {}
