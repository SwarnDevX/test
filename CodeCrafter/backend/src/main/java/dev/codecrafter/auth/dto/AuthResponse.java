package dev.codecrafter.auth.dto;

import java.util.List;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    Long userId,
    String email,
    String username,
    List<String> roles
) {}
