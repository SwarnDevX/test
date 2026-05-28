package dev.codecrafter.contest;

import dev.codecrafter.contest.entity.Contest;
import dev.codecrafter.contest.entity.ContestParticipant;
import dev.codecrafter.contest.entity.ContestRating;
import dev.codecrafter.contest.repository.ContestParticipantRepository;
import dev.codecrafter.contest.repository.ContestRatingRepository;
import dev.codecrafter.user.repository.UserRepository;
import dev.codecrafter.user.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RatingService {

    private final ContestParticipantRepository participantRepository;
    private final ContestRatingRepository ratingRepository;
    private final UserStatsRepository userStatsRepository;
    private final UserRepository userRepository;

    private static final int DEFAULT_RATING = 1500;

    /**
     * Compute and persist Elo-style rating changes for all ranked participants of a contest.
     * Must be called after finalizeLeaderboard().
     */
    @Transactional
    public void computeRatings(Contest contest) {
        List<ContestParticipant> ranked = participantRepository.findFinalRankedByContestId(contest.getId());
        if (ranked.size() < 2) {
            log.info("Contest {} has < 2 ranked participants, skipping rating update", contest.getId());
            return;
        }

        int n = ranked.size();

        // Gather current ratings
        int[] oldRatings = new int[n];
        for (int i = 0; i < n; i++) {
            oldRatings[i] = userStatsRepository.findByUserId(ranked.get(i).getUser().getId())
                .map(s -> s.getContestRating())
                .orElse(DEFAULT_RATING);
        }

        // Compute Elo deltas
        for (int i = 0; i < n; i++) {
            int rank = ranked.get(i).getFinalRank(); // 1-based
            double actual   = (double)(n - rank) / (n - 1);          // fraction of opponents beaten
            double expected = computeExpected(i, oldRatings);
            int K = oldRatings[i] < 2100 ? 40 : 20;
            int delta = (int) Math.round(K * (actual - expected));

            int newRating = Math.max(100, oldRatings[i] + delta);

            // Persist rating history
            if (!ratingRepository.existsByUserIdAndContestId(ranked.get(i).getUser().getId(), contest.getId())) {
                ratingRepository.save(ContestRating.builder()
                    .user(ranked.get(i).getUser())
                    .contest(contest)
                    .oldRating(oldRatings[i])
                    .newRating(newRating)
                    .rank(rank)
                    .participantCount(n)
                    .build());
            }

            // Update user_stats
            final int finalNewRating = newRating;
            final int finalDelta = delta;
            userStatsRepository.findByUserId(ranked.get(i).getUser().getId()).ifPresent(stats -> {
                stats.setContestRating(finalNewRating);
                stats.setContestsParticipated(stats.getContestsParticipated() + 1);
                userStatsRepository.save(stats);
            });

            // Store rating change on participant record
            final int storedDelta = delta;
            ranked.get(i).setRatingChange(storedDelta);
            participantRepository.save(ranked.get(i));
        }

        log.info("Rating update complete for contest {} ({} participants)", contest.getId(), n);
    }

    private double computeExpected(int idx, int[] ratings) {
        int n = ratings.length;
        double sum = 0;
        for (int j = 0; j < n; j++) {
            if (j == idx) continue;
            sum += 1.0 / (1.0 + Math.pow(10, (ratings[j] - ratings[idx]) / 400.0));
        }
        return sum / (n - 1);
    }

    public List<dev.codecrafter.contest.dto.ContestRatingHistoryDto> getHistory(Long userId) {
        return ratingRepository.findByUserIdOrderByCreatedAtAsc(userId).stream()
            .map(this::toHistoryDto).toList();
    }

    public List<dev.codecrafter.contest.dto.ContestRatingHistoryDto> getHistoryByUsername(String username) {
        return userRepository.findByUsername(username)
            .map(u -> ratingRepository.findByUserIdOrderByCreatedAtAsc(u.getId())
                .stream().map(this::toHistoryDto).toList())
            .orElse(List.of());
    }

    private dev.codecrafter.contest.dto.ContestRatingHistoryDto toHistoryDto(ContestRating r) {
        return new dev.codecrafter.contest.dto.ContestRatingHistoryDto(
            r.getContest().getId(), r.getContest().getTitle(), r.getContest().getSlug(),
            r.getOldRating(), r.getNewRating(), r.getNewRating() - r.getOldRating(),
            r.getRank(), r.getParticipantCount(), r.getCreatedAt()
        );
    }
}
