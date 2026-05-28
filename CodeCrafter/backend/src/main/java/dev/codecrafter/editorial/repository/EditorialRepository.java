package dev.codecrafter.editorial.repository;

import dev.codecrafter.editorial.entity.Editorial;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EditorialRepository extends JpaRepository<Editorial, Long> {
    Optional<Editorial> findByProblemId(Long problemId);
    Optional<Editorial> findByProblemIdAndIsPublishedTrue(Long problemId);
}
