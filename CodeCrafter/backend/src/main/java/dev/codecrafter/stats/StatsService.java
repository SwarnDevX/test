package dev.codecrafter.stats;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.stats.dto.*;
import dev.codecrafter.stats.repository.UserActivityRepository;
import dev.codecrafter.stats.repository.UserBadgeRepository;
import dev.codecrafter.submission.entity.Submission;
import dev.codecrafter.submission.repository.SubmissionRepository;
import dev.codecrafter.user.entity.UserStats;
import dev.codecrafter.user.repository.UserRepository;
import dev.codecrafter.user.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class StatsService {

    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;
    private final UserActivityRepository userActivityRepository;
    private final UserBadgeRepository userBadgeRepository;
    private final SubmissionRepository submissionRepository;

    @Transactional(readOnly = true)
    public UserStatsDetailDto getStatsDetail(String username) {
        var user = userRepository.findByUsername(username)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        Long userId = user.getId();

        UserStats stats = userStatsRepository.findByUserId(userId)
            .orElseGet(UserStats::new);

        // Heatmap — last 365 days
        LocalDate cutoff = LocalDate.now().minusDays(364);
        var activities = userActivityRepository.findByUserIdSince(userId, cutoff);
        Map<LocalDate, Integer> actMap = new LinkedHashMap<>();
        activities.forEach(a -> actMap.put(a.getActivityDate(), a.getAcCount()));

        List<HeatmapEntry> heatmap = new ArrayList<>(365);
        LocalDate d = cutoff;
        LocalDate today = LocalDate.now();
        while (!d.isAfter(today)) {
            heatmap.add(new HeatmapEntry(d, actMap.getOrDefault(d, 0)));
            d = d.plusDays(1);
        }

        // Language breakdown
        List<Object[]> langRows = submissionRepository.findAcCountByLanguage(userId);
        long totalAc = langRows.stream().mapToLong(r -> (Long) r[1]).sum();
        List<LanguageStat> langs = langRows.stream()
            .map(r -> new LanguageStat(
                (String) r[0],
                (Long) r[1],
                totalAc == 0 ? 0 : Math.round((Long) r[1] * 1000.0 / totalAc) / 10.0
            )).toList();

        // Top tags (from AC submissions)
        List<TagStat> tags = buildTagStats(userId);

        // Recent AC
        List<Submission> recentSubs = submissionRepository.findRecentAcByUserId(userId, PageRequest.of(0, 20));
        List<RecentAcSubmission> recentAc = recentSubs.stream()
            .map(s -> new RecentAcSubmission(
                s.getId(),
                s.getProblem().getSlug(),
                s.getProblem().getTitle(),
                s.getProblem().getNumber(),
                s.getLanguage(),
                s.getRuntimeMs(),
                s.getCreatedAt()
            )).toList();

        // Badges
        var badges = userBadgeRepository.findByUserIdOrderByAwardedAtDesc(userId)
            .stream().map(BadgeDto::from).toList();

        return new UserStatsDetailDto(
            stats.getEasySolved(),
            stats.getMediumSolved(),
            stats.getHardSolved(),
            stats.getTotalSolved(),
            stats.getCurrentStreak(),
            stats.getLongestStreak(),
            stats.getRanking(),
            heatmap, langs, tags, recentAc, badges
        );
    }

    private List<TagStat> buildTagStats(Long userId) {
        // Native query would be more efficient but JPQL join is fine for Phase 4
        List<Submission> acSubs = submissionRepository
            .findRecentAcByUserId(userId, PageRequest.of(0, 500));

        Map<String, Long> tagCount = new LinkedHashMap<>();
        acSubs.stream()
            .flatMap(s -> s.getProblem().getTags().stream())
            .forEach(tag -> tagCount.merge(tag.getName(), 1L, Long::sum));

        return tagCount.entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
            .limit(10)
            .map(e -> new TagStat(e.getKey(), e.getValue()))
            .toList();
    }
}
