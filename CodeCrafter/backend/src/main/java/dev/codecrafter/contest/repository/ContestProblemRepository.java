package dev.codecrafter.contest.repository;

import dev.codecrafter.contest.entity.ContestProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContestProblemRepository extends JpaRepository<ContestProblem, Long> {
    List<ContestProblem> findByContestIdOrderByOrderIndexAsc(Long contestId);
    Optional<ContestProblem> findByContestIdAndProblemId(Long contestId, Long problemId);
    boolean existsByContestIdAndProblemId(Long contestId, Long problemId);

    @Query("SELECT cp FROM ContestProblem cp WHERE cp.problem.id = :problemId AND cp.contest.status = 'RUNNING'")
    List<ContestProblem> findActiveContestEntriesForProblem(Long problemId);
}
