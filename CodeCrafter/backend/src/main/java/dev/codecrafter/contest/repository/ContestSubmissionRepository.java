package dev.codecrafter.contest.repository;

import dev.codecrafter.contest.entity.ContestSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContestSubmissionRepository extends JpaRepository<ContestSubmission, Long> {
    Optional<ContestSubmission> findBySubmissionId(Long submissionId);
    List<ContestSubmission> findByContestIdAndUserId(Long contestId, Long userId);
    Optional<ContestSubmission> findByContestIdAndProblemIdAndUserIdAndIsAcceptedTrue(Long contestId, Long problemId, Long userId);

    @Query("SELECT COUNT(cs) FROM ContestSubmission cs WHERE cs.contest.id = :contestId AND cs.problem.id = :problemId AND cs.user.id = :userId AND cs.isAccepted = false AND cs.solvedAt IS NULL")
    long countWrongAttempts(Long contestId, Long problemId, Long userId);

    boolean existsByContestIdAndProblemIdAndUserIdAndIsAcceptedTrue(Long contestId, Long problemId, Long userId);
}
