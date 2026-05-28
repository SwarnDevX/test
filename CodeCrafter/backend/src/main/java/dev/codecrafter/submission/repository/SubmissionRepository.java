package dev.codecrafter.submission.repository;

import dev.codecrafter.submission.entity.Submission;
import dev.codecrafter.submission.entity.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface SubmissionRepository extends JpaRepository<Submission, Long> {

    @Query("SELECT s FROM Submission s WHERE s.user.id = :userId ORDER BY s.createdAt DESC")
    Page<Submission> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT s FROM Submission s WHERE s.user.id = :userId AND s.problem.id = :problemId ORDER BY s.createdAt DESC")
    Page<Submission> findByUserIdAndProblemId(Long userId, Long problemId, Pageable pageable);

    @Query("SELECT s FROM Submission s WHERE s.problem.slug = :slug AND s.user.id = :userId ORDER BY s.createdAt DESC")
    Page<Submission> findByProblemSlugAndUserId(String slug, Long userId, Pageable pageable);

    boolean existsByUserIdAndProblemIdAndStatus(Long userId, Long problemId, SubmissionStatus status);

    @Query("SELECT s FROM Submission s WHERE s.problem.id = :problemId ORDER BY s.createdAt DESC")
    List<Submission> findByProblemId(Long problemId);

    /** Returns distinct languages in which the user has at least one AC submission. */
    @Query("SELECT DISTINCT s.language FROM Submission s WHERE s.user.id = :userId AND s.verdict = 'ACCEPTED'")
    List<String> findDistinctAcLanguages(Long userId);

    /** Count AC submissions for a given user+problem (used to detect first-time solve). */
    @Query("SELECT COUNT(s) FROM Submission s WHERE s.user.id = :userId AND s.problem.id = :problemId AND s.verdict = dev.codecrafter.submission.entity.SubmissionStatus.ACCEPTED")
    long countAcByUserAndProblem(Long userId, Long problemId);

    /** Recent AC submissions for a user (for stats display). */
    @Query("SELECT s FROM Submission s WHERE s.user.id = :userId AND s.verdict = dev.codecrafter.submission.entity.SubmissionStatus.ACCEPTED ORDER BY s.createdAt DESC")
    List<Submission> findRecentAcByUserId(Long userId, Pageable pageable);

    /** Language breakdown: language + count of AC submissions per language. */
    @Query("SELECT s.language, COUNT(s) FROM Submission s WHERE s.user.id = :userId AND s.verdict = dev.codecrafter.submission.entity.SubmissionStatus.ACCEPTED GROUP BY s.language ORDER BY COUNT(s) DESC")
    List<Object[]> findAcCountByLanguage(Long userId);
}
