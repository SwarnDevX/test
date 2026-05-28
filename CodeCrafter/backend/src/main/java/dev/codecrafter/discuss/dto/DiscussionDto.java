package dev.codecrafter.discuss.dto;

import java.time.Instant;

public record DiscussionDto(
    Long id,
    Long problemId,
    String problemTitle,
    String problemSlug,
    String authorUsername,
    String authorAvatar,
    String title,
    String contentMarkdown,
    String category,
    int voteScore,
    int replyCount,
    boolean isAnswered,
    Integer myVote,
    Instant createdAt,
    Instant updatedAt
) {}
