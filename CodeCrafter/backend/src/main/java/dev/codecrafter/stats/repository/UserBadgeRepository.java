package dev.codecrafter.stats.repository;

import dev.codecrafter.stats.entity.UserBadge;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserBadgeRepository extends JpaRepository<UserBadge, Long> {

    List<UserBadge> findByUserIdOrderByAwardedAtDesc(Long userId);

    boolean existsByUserIdAndBadgeSlug(Long userId, String badgeSlug);
}
