package dev.codecrafter.solution.repository;

import dev.codecrafter.solution.entity.SolutionVote;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SolutionVoteRepository extends JpaRepository<SolutionVote, Long> {
    Optional<SolutionVote> findBySolutionIdAndUserId(Long solutionId, Long userId);
    void deleteBySolutionIdAndUserId(Long solutionId, Long userId);
}
