package dev.codecrafter.stats;

import dev.codecrafter.problem.entity.Difficulty;
import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.problem.repository.ProblemRepository;
import dev.codecrafter.stats.entity.UserActivity;
import dev.codecrafter.stats.repository.UserActivityRepository;
import dev.codecrafter.submission.repository.SubmissionRepository;
import dev.codecrafter.user.entity.UserStats;
import dev.codecrafter.user.repository.UserRepository;
import dev.codecrafter.user.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class StatsSyncService {

    private final UserStatsRepository userStatsRepository;
    private final UserRepository userRepository;
    private final UserActivityRepository userActivityRepository;
    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final BadgeEngine badgeEngine;

    /**
     * Called after every AC verdict. Updates denormalised stats, activity, streaks, then runs badge engine.
     */
    @Transactional
    public void onAccepted(Long userId, Long problemId) {
        // Only count if this is the first AC for this user+problem
        long priorAc = submissionRepository.countAcByUserAndProblem(userId, problemId);
        boolean firstSolve = priorAc <= 1; // the current submission is already persisted

        if (firstSolve) {
            Problem problem = problemRepository.findById(problemId).orElse(null);
            if (problem == null) return;

            UserStats stats = userStatsRepository.findByUserId(userId)
                .orElseGet(() -> {
                    var user = userRepository.findById(userId).orElseThrow();
                    return userStatsRepository.save(UserStats.builder().user(user).build());
                });

            stats.setTotalSolved(stats.getTotalSolved() + 1);
            if (problem.getDifficulty() == Difficulty.EASY)   stats.setEasySolved(stats.getEasySolved() + 1);
            if (problem.getDifficulty() == Difficulty.MEDIUM) stats.setMediumSolved(stats.getMediumSolved() + 1);
            if (problem.getDifficulty() == Difficulty.HARD)   stats.setHardSolved(stats.getHardSolved() + 1);

            userStatsRepository.save(stats);
        }

        // Always update activity and recompute streaks
        upsertActivity(userId);
        recomputeStreaks(userId);
        badgeEngine.evaluate(userId);
    }

    private void upsertActivity(Long userId) {
        LocalDate today = LocalDate.now();
        userActivityRepository.findByUserIdAndActivityDate(userId, today)
            .ifPresentOrElse(
                a -> { a.setAcCount(a.getAcCount() + 1); userActivityRepository.save(a); },
                () -> {
                    var user = userRepository.findById(userId).orElseThrow();
                    userActivityRepository.save(
                        UserActivity.builder().user(user).activityDate(today).acCount(1).build()
                    );
                }
            );
    }

    private void recomputeStreaks(Long userId) {
        List<LocalDate> activeDates = userActivityRepository.findActiveDates(userId);
        if (activeDates.isEmpty()) return;

        LocalDate today = LocalDate.now();
        LocalDate prev = null;
        int cur = 0;
        int longest = 0;
        int running = 0;

        for (LocalDate d : activeDates) { // ordered DESC
            if (prev == null) {
                if (!d.equals(today) && !d.equals(today.minusDays(1))) {
                    cur = 0;
                } else {
                    running = 1;
                    cur = 1;
                }
            } else if (prev.minusDays(1).equals(d)) {
                running++;
                if (running > cur) cur = running;
            } else {
                running = 1;
            }
            if (running > longest) longest = running;
            prev = d;
        }

        final int finalCur = cur;
        final int finalLongest = longest;
        userStatsRepository.findByUserId(userId).ifPresent(stats -> {
            stats.setCurrentStreak(finalCur);
            if (finalLongest > stats.getLongestStreak()) stats.setLongestStreak(finalLongest);
            userStatsRepository.save(stats);
        });
    }
}
