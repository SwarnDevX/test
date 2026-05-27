package dev.codecrafter.stats.repository;

import dev.codecrafter.stats.entity.Badge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BadgeRepository extends JpaRepository<Badge, Long> {
    Optional<Badge> findBySlug(String slug);
}
