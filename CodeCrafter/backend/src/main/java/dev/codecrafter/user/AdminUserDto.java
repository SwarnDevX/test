package dev.codecrafter.user;

import java.time.Instant;
import java.util.Set;

public record AdminUserDto(
    Long id,
    String email,
    String username,
    boolean emailVerified,
    boolean active,
    Set<String> roles,
    Instant createdAt
) {}
