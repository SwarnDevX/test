package dev.codecrafter.studyplan.repository;

import dev.codecrafter.studyplan.entity.StudyPlanProblem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface StudyPlanProblemRepository extends JpaRepository<StudyPlanProblem, Long> {
    List<StudyPlanProblem> findByPlanIdOrderByOrderIndexAsc(Long planId);

    @Query("SELECT spp FROM StudyPlanProblem spp WHERE spp.problem.id = :problemId")
    List<StudyPlanProblem> findByProblemId(Long problemId);

    boolean existsByPlanIdAndProblemId(Long planId, Long problemId);

    void deleteByPlanIdAndProblemId(Long planId, Long problemId);

    @Query("SELECT COUNT(spp) FROM StudyPlanProblem spp WHERE spp.plan.id = :planId")
    long countByPlanId(Long planId);
}
