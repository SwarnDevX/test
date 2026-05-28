package dev.codecrafter.contest.repository;

import dev.codecrafter.contest.entity.Contest;
import dev.codecrafter.contest.entity.ContestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContestRepository extends JpaRepository<Contest, Long> {
    Optional<Contest> findBySlug(String slug);
    Optional<Contest> findBySlugAndIsVisibleTrue(String slug);
    Page<Contest> findByIsVisibleTrueOrderByStartTimeDesc(Pageable pageable);
    List<Contest> findByStatus(ContestStatus status);
}
