package dev.codecrafter.submission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SubmitRequest(
    @NotBlank String language,
    @NotBlank @Size(max = 65536) String sourceCode
) {}
