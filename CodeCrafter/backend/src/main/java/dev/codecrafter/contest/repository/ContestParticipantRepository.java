package dev.codecrafter.contest.repository;

import dev.codecrafter.contest.entity.ContestParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, Long> {
    Optional<ContestParticipant> findByContestIdAndUserId(Long contestId, Long userId);
    boolean existsByContestIdAndUserId(Long contestId, Long userId);
    List<ContestParticipant> findByContestIdOrderByFinalRankAsc(Long contestId);

    @Query("SELECT p FROM ContestParticipant p WHERE p.contest.id = :contestId AND p.finalRank IS NOT NULL ORDER BY p.finalRank ASC")
    List<ContestParticipant> findFinalRankedByContestId(Long contestId);

    long countByContestId(Long contestId);
}
