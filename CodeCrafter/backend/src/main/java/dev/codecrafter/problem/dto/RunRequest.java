package dev.codecrafter.problem.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RunRequest(
    @NotBlank String language,
    @NotBlank @Size(max = 65536) String sourceCode,
    String customInput   // null → run against all sample test cases
) {}
