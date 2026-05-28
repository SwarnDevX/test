package dev.codecrafter.contest.repository;

import dev.codecrafter.contest.entity.ContestRating;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContestRatingRepository extends JpaRepository<ContestRating, Long> {
    List<ContestRating> findByUserIdOrderByCreatedAtAsc(Long userId);
    boolean existsByUserIdAndContestId(Long userId, Long contestId);
}
