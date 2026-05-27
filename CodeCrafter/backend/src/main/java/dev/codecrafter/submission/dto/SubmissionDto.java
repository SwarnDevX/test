package dev.codecrafter.submission.dto;

import dev.codecrafter.submission.entity.Submission;
import dev.codecrafter.submission.entity.SubmissionStatus;

import java.time.Instant;

public record SubmissionDto(
    Long id,
    String problemSlug,
    String problemTitle,
    Integer problemNumber,
    String language,
    SubmissionStatus status,
    SubmissionStatus verdict,
    Integer runtimeMs,
    Integer memoryKb,
    Integer testcasesPassed,
    Integer totalTestcases,
    Instant createdAt
) {
    public static SubmissionDto from(Submission s) {
        return new SubmissionDto(
            s.getId(),
            s.getProblem().getSlug(),
            s.getProblem().getTitle(),
            s.getProblem().getNumber(),
            s.getLanguage(),
            s.getStatus(),
            s.getVerdict(),
            s.getRuntimeMs(),
            s.getMemoryKb(),
            s.getTestcasesPassed(),
            s.getTotalTestcases(),
            s.getCreatedAt()
        );
    }
}
