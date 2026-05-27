package dev.codecrafter.submission.repository;

import dev.codecrafter.submission.entity.Submission;
import dev.codecrafter.submission.entity.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    @Query("SELECT s FROM Submission s WHERE s.user.id = :userId ORDER BY s.createdAt DESC")
    Page<Submission> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT s FROM Submission s WHERE s.user.id = :userId AND s.problem.id = :problemId ORDER BY s.createdAt DESC")
    Page<Submission> findByUserIdAndProblemId(Long userId, Long problemId, Pageable pageable);

    @Query("SELECT s FROM Submission s WHERE s.problem.slug = :slug AND s.user.id = :userId ORDER BY s.createdAt DESC")
    Page<Submission> findByProblemSlugAndUserId(String slug, Long userId, Pageable pageable);

    boolean existsByUserIdAndProblemIdAndStatus(Long userId, Long problemId, SubmissionStatus status);
}
