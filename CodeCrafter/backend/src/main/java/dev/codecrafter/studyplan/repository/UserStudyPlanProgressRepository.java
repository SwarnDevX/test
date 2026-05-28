package dev.codecrafter.studyplan.repository;

import dev.codecrafter.studyplan.entity.UserStudyPlanProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Set;

public interface UserStudyPlanProgressRepository extends JpaRepository<UserStudyPlanProgress, Long> {
    List<UserStudyPlanProgress> findByUserIdAndPlanId(Long userId, Long planId);

    @Query("SELECT p.problem.id FROM UserStudyPlanProgress p WHERE p.user.id = :userId AND p.plan.id = :planId")
    Set<Long> findCompletedProblemIds(Long userId, Long planId);

    long countByUserIdAndPlanId(Long userId, Long planId);

    boolean existsByUserIdAndPlanIdAndProblemId(Long userId, Long planId, Long problemId);
}
