package dev.codecrafter.stats;

import dev.codecrafter.stats.entity.Badge;
import dev.codecrafter.stats.entity.UserBadge;
import dev.codecrafter.stats.repository.BadgeRepository;
import dev.codecrafter.stats.repository.UserBadgeRepository;
import dev.codecrafter.submission.repository.SubmissionRepository;
import dev.codecrafter.user.entity.User;
import dev.codecrafter.user.entity.UserStats;
import dev.codecrafter.user.repository.UserRepository;
import dev.codecrafter.user.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;

@Component
@RequiredArgsConstructor
@Slf4j
public class BadgeEngine {

    private final BadgeRepository badgeRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;
    private final SubmissionRepository submissionRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void evaluate(Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        UserStats stats = userStatsRepository.findByUserId(userId).orElse(null);
        if (stats == null) return;

        long totalSubmissions = submissionRepository.findByUserId(userId, org.springframework.data.domain.PageRequest.of(0, 1)).getTotalElements();
        long distinctLanguages = countDistinctAcLanguages(userId);
        boolean hasNightSubmission = hasNightSubmission(userId);

        award(user, "first-submission", totalSubmissions >= 1);
        award(user, "first-ac", stats.getTotalSolved() >= 1);
        award(user, "10-solved",  stats.getTotalSolved() >= 10);
        award(user, "50-solved",  stats.getTotalSolved() >= 50);
        award(user, "100-solved", stats.getTotalSolved() >= 100);
        award(user, "7-day-streak",  stats.getLongestStreak() >= 7);
        award(user, "30-day-streak", stats.getLongestStreak() >= 30);
        award(user, "first-hard", stats.getHardSolved() >= 1);
        award(user, "polyglot",   distinctLanguages >= 3);
        award(user, "night-owl",  hasNightSubmission);
    }

    private void award(User user, String slug, boolean condition) {
        if (!condition) return;
        if (userBadgeRepository.existsByUserIdAndBadgeSlug(user.getId(), slug)) return;

        badgeRepository.findBySlug(slug).ifPresent(badge -> {
            UserBadge ub = UserBadge.builder().user(user).badge(badge).build();
            userBadgeRepository.save(ub);
            log.info("Awarded badge '{}' to user {}", slug, user.getUsername());
        });
    }

    private long countDistinctAcLanguages(Long userId) {
        return submissionRepository.findDistinctAcLanguages(userId).size();
    }

    private boolean hasNightSubmission(Long userId) {
        return submissionRepository.findByUserId(
                userId, org.springframework.data.domain.PageRequest.of(0, 200))
            .getContent()
            .stream()
            .anyMatch(s -> {
                int hour = s.getCreatedAt().atZone(ZoneOffset.UTC).getHour();
                return hour >= 0 && hour < 5;
            });
    }
}
