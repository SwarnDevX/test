package dev.codecrafter.auth.dto;

import jakarta.validation.constraints.*;

public record RegisterRequest(
    @NotBlank @Email(message = "must be a valid email address")
    String email,

    @NotBlank @Size(min = 3, max = 50, message = "must be 3–50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "only letters, numbers and underscores allowed")
    String username,

    @NotBlank @Size(min = 8, message = "must be at least 8 characters")
    String password
) {}
