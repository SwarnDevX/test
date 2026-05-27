package dev.codecrafter.stats.dto;

import java.time.Instant;

public record RecentAcSubmission(
    Long id,
    String problemSlug,
    String problemTitle,
    Integer problemNumber,
    String language,
    Integer runtimeMs,
    Instant submittedAt
) {}
