package dev.codecrafter.discuss.dto;

import java.time.Instant;
import java.util.List;

public record DiscussionReplyDto(
    Long id,
    String authorUsername,
    String authorAvatar,
    String contentMarkdown,
    int voteScore,
    boolean isAnswer,
    Integer myVote,
    Instant createdAt,
    List<DiscussionReplyDto> replies
) {}
