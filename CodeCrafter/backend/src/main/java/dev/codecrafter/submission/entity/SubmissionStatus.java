package dev.codecrafter.submission.entity;

public enum SubmissionStatus {
    // Lifecycle
    QUEUED,
    RUNNING,
    // Final verdicts
    ACCEPTED,
    WRONG_ANSWER,
    COMPILE_ERROR,
    RUNTIME_ERROR,
    TIME_LIMIT_EXCEEDED,
    MEMORY_LIMIT_EXCEEDED,
    OUTPUT_LIMIT_EXCEEDED,
    INTERNAL_ERROR;

    public boolean isTerminal() {
        return switch (this) {
            case QUEUED, RUNNING -> false;
            default -> true;
        };
    }
}
