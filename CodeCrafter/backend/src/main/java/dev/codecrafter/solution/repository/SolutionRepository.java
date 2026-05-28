package dev.codecrafter.solution.repository;

import dev.codecrafter.solution.entity.Solution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SolutionRepository extends JpaRepository<Solution, Long> {
    Page<Solution> findByProblemId(Long problemId, Pageable pageable);
}
