package dev.codecrafter.problem.repository;

import dev.codecrafter.problem.entity.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long>,
        JpaSpecificationExecutor<Problem> {

    Optional<Problem> findBySlugAndActiveTrue(String slug);

    boolean existsBySlug(String slug);
    boolean existsByNumber(int number);
    long countByActiveTrue();

    // Random active problem — filters applied externally via spec
    @Query(value = "SELECT * FROM problems WHERE active = true ORDER BY RANDOM() LIMIT 1", nativeQuery = true)
    Optional<Problem> findRandom();

    @Query(value = """
        SELECT * FROM problems p
        WHERE p.active = true
          AND (:difficulty IS NULL OR p.difficulty = :difficulty)
        ORDER BY RANDOM()
        LIMIT 1
        """, nativeQuery = true)
    Optional<Problem> findRandomByDifficulty(String difficulty);
}
