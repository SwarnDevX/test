package dev.codecrafter.contest.dto;

import java.time.Instant;

public record ContestDto(
    Long id,
    String slug,
    String title,
    String description,
    String type,
    Instant startTime,
    Instant endTime,
    String status,
    long participantCount,
    boolean registered
) {}
