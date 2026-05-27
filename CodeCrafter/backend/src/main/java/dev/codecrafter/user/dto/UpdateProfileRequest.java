package dev.codecrafter.user.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
    @Size(max = 100) String displayName,
    @Size(max = 500) String bio,
    @Size(max = 100) String location,
    @Size(max = 100) String company,
    @Size(max = 100) String school,
    @Size(max = 200) String githubUrl,
    @Size(max = 200) String linkedinUrl,
    @Size(max = 200) String twitterUrl,
    @Size(max = 500) String preferredLanguages
) {}
