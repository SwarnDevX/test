package dev.codecrafter.discuss.repository;

import dev.codecrafter.discuss.entity.Discussion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiscussionRepository extends JpaRepository<Discussion, Long> {
    Page<Discussion> findByProblemId(Long problemId, Pageable pageable);
    Page<Discussion> findByProblemIsNull(Pageable pageable);
    Page<Discussion> findByProblemIsNullAndCategory(String category, Pageable pageable);
}
