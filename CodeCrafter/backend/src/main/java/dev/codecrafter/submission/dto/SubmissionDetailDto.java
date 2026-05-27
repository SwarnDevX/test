package dev.codecrafter.submission.dto;

import dev.codecrafter.submission.entity.Submission;
import dev.codecrafter.submission.entity.SubmissionStatus;

import java.time.Instant;

public record SubmissionDetailDto(
    Long id,
    String problemSlug,
    String problemTitle,
    Integer problemNumber,
    String language,
    String sourceCode,
    SubmissionStatus status,
    SubmissionStatus verdict,
    Integer runtimeMs,
    Integer memoryKb,
    Integer testcasesPassed,
    Integer totalTestcases,
    Integer failingTestcaseIndex,
    String compileError,
    String stdout,
    String stderr,
    Instant createdAt
) {
    public static SubmissionDetailDto from(Submission s) {
        return new SubmissionDetailDto(
            s.getId(),
            s.getProblem().getSlug(),
            s.getProblem().getTitle(),
            s.getProblem().getNumber(),
            s.getLanguage(),
            s.getSourceCode(),
            s.getStatus(),
            s.getVerdict(),
            s.getRuntimeMs(),
            s.getMemoryKb(),
            s.getTestcasesPassed(),
            s.getTotalTestcases(),
            s.getFailingTestcaseIndex(),
            s.getCompileError(),
            s.getStdout(),
            s.getStderr(),
            s.getCreatedAt()
        );
    }
}
