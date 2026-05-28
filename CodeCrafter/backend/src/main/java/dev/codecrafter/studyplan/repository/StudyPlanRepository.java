package dev.codecrafter.studyplan.repository;

import dev.codecrafter.studyplan.entity.StudyPlan;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudyPlanRepository extends JpaRepository<StudyPlan, Long> {
    List<StudyPlan> findByIsPublishedTrueOrderByCreatedAtAsc();
    Optional<StudyPlan> findBySlug(String slug);
    Optional<StudyPlan> findBySlugAndIsPublishedTrue(String slug);
}
