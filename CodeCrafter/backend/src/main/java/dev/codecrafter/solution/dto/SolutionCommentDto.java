package dev.codecrafter.solution.dto;

import java.time.Instant;
import java.util.List;

public record SolutionCommentDto(
    Long id,
    String authorUsername,
    String authorAvatar,
    String contentMarkdown,
    int voteScore,
    Integer myVote,
    Instant createdAt,
    List<SolutionCommentDto> replies
) {}
