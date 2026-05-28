package dev.codecrafter.solution.repository;

import dev.codecrafter.solution.entity.SolutionComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SolutionCommentRepository extends JpaRepository<SolutionComment, Long> {
    List<SolutionComment> findBySolutionIdAndParentIsNullOrderByCreatedAtAsc(Long solutionId);
    List<SolutionComment> findByParentIdOrderByCreatedAtAsc(Long parentId);
}
