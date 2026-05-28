package dev.codecrafter.contest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateContestRequest(
    @NotBlank @Size(max = 80) String slug,
    @NotBlank @Size(max = 200) String title,
    String description,
    String type,
    @NotNull Instant startTime,
    @NotNull Instant endTime,
    boolean visible
) {}
