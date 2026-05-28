package dev.codecrafter.contest;

import dev.codecrafter.contest.dto.LeaderboardEntryDto;
import dev.codecrafter.contest.entity.Contest;
import dev.codecrafter.contest.entity.ContestParticipant;
import dev.codecrafter.contest.repository.ContestParticipantRepository;
import dev.codecrafter.user.entity.UserProfile;
import dev.codecrafter.user.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ContestLeaderboardService {

    private static final int WRONG_PENALTY_SECS = 300; // 5 minutes per wrong attempt

    private final StringRedisTemplate redis;
    private final SimpMessagingTemplate ws;
    private final ContestParticipantRepository participantRepository;
    private final UserProfileRepository userProfileRepository;

    private String lbKey(Long contestId)       { return "contest:" + contestId + ":lb"; }
    private String waKey(Long contestId, Long userId, Long problemId) {
        return "contest:" + contestId + ":u:" + userId + ":p:" + problemId + ":wa";
    }
    private String solvedKey(Long contestId, Long userId, Long problemId) {
        return "contest:" + contestId + ":u:" + userId + ":p:" + problemId + ":solved";
    }

    /** Called when WA verdict arrives for a registered contest participant. */
    public void recordWrongAttempt(Long contestId, Long userId, Long problemId) {
        String solvedKey = solvedKey(contestId, userId, problemId);
        if (Boolean.TRUE.equals(redis.hasKey(solvedKey))) return; // already solved, ignore
        redis.opsForValue().increment(waKey(contestId, userId, problemId));
    }

    /**
     * Called when AC verdict arrives for a registered contest participant.
     * Updates Redis leaderboard and broadcasts via WebSocket.
     */
    public void recordAccepted(Contest contest, Long userId, Long problemId, Instant solvedAt) {
        String solvedKey = solvedKey(contest.getId(), userId, problemId);
        if (Boolean.TRUE.equals(redis.hasKey(solvedKey))) return; // already solved this problem

        // Mark problem solved
        redis.opsForValue().set(solvedKey, "1", Duration.ofHours(48));

        // Compute penalty for this problem
        String waKeyStr = waKey(contest.getId(), userId, problemId);
        String waStr = redis.opsForValue().get(waKeyStr);
        int wrongAttempts = waStr != null ? Integer.parseInt(waStr) : 0;
        long elapsedSecs = Duration.between(contest.getStartTime(), solvedAt).getSeconds();
        long problemPenalty = elapsedSecs + (long) wrongAttempts * WRONG_PENALTY_SECS;

        // Update user totals in Redis
        String solvedCountKey = "contest:" + contest.getId() + ":u:" + userId + ":solved";
        String penaltyKey     = "contest:" + contest.getId() + ":u:" + userId + ":penalty";
        redis.opsForValue().increment(solvedCountKey);
        redis.opsForValue().increment(penaltyKey, problemPenalty);

        String solvedStr  = redis.opsForValue().get(solvedCountKey);
        String penaltyStr = redis.opsForValue().get(penaltyKey);
        int solved  = solvedStr  != null ? Integer.parseInt(solvedStr)  : 1;
        long penalty = penaltyStr != null ? Long.parseLong(penaltyStr) : problemPenalty;

        // score: higher = better; primary = solved, secondary = less penalty
        double score = solved * 1_000_000_000.0 - penalty;
        redis.opsForZSet().add(lbKey(contest.getId()), userId.toString(), score);

        // Sync to DB participant record
        participantRepository.findByContestIdAndUserId(contest.getId(), userId).ifPresent(p -> {
            p.setSolvedCount(solved);
            p.setPenaltySecs((int) penalty);
            participantRepository.save(p);
        });

        // Broadcast top 50 leaderboard via WebSocket
        ws.convertAndSend("/topic/contest/" + contest.getId() + "/leaderboard",
            getTop(contest.getId(), 50));
    }

    /** Get top N leaderboard entries (from Redis during contest, from DB after). */
    public List<LeaderboardEntryDto> getTop(Long contestId, int n) {
        Set<org.springframework.data.redis.core.ZSetOperations.TypedTuple<String>> entries =
            redis.opsForZSet().reverseRangeWithScores(lbKey(contestId), 0, n - 1L);

        if (entries == null || entries.isEmpty()) return List.of();

        List<LeaderboardEntryDto> result = new ArrayList<>();
        int rank = 1;
        for (var entry : entries) {
            Long userId = Long.parseLong(entry.getValue());
            double sc = entry.getScore() != null ? entry.getScore() : 0;
            int solved  = (int) (sc / 1_000_000_000.0);
            int penalty = (int) (solved * 1_000_000_000L - (long) sc);

            UserProfile profile = userProfileRepository.findByUserId(userId).orElse(null);
            String username  = profile != null && profile.getUser() != null ? profile.getUser().getUsername() : "user" + userId;
            String avatarUrl = profile != null ? profile.getAvatarUrl() : null;

            result.add(new LeaderboardEntryDto(rank++, userId, username, avatarUrl, solved, penalty, null));
        }
        return result;
    }

    /** Build leaderboard from DB for ended contests. */
    public List<LeaderboardEntryDto> getFromDb(Long contestId) {
        List<ContestParticipant> ranked = participantRepository.findFinalRankedByContestId(contestId);
        List<LeaderboardEntryDto> result = new ArrayList<>();
        for (ContestParticipant p : ranked) {
            UserProfile profile = userProfileRepository.findByUserId(p.getUser().getId()).orElse(null);
            String username  = p.getUser().getUsername();
            String avatarUrl = profile != null ? profile.getAvatarUrl() : null;
            result.add(new LeaderboardEntryDto(
                p.getFinalRank(), p.getUser().getId(), username, avatarUrl,
                p.getSolvedCount(), p.getPenaltySecs(), p.getRatingChange()
            ));
        }
        return result;
    }

    /** Flush Redis leaderboard to DB final ranks. Called when contest ends. */
    public void finalizeLeaderboard(Long contestId) {
        Set<org.springframework.data.redis.core.ZSetOperations.TypedTuple<String>> all =
            redis.opsForZSet().reverseRangeWithScores(lbKey(contestId), 0, -1);
        if (all == null) return;

        int rank = 1;
        for (var entry : all) {
            Long userId = Long.parseLong(entry.getValue());
            double sc = entry.getScore() != null ? entry.getScore() : 0;
            int solved  = (int) (sc / 1_000_000_000.0);
            int penalty = (int) (solved * 1_000_000_000L - (long) sc);
            int finalRank = rank++;

            participantRepository.findByContestIdAndUserId(contestId, userId).ifPresent(p -> {
                p.setSolvedCount(solved);
                p.setPenaltySecs(penalty);
                p.setFinalRank(finalRank);
                participantRepository.save(p);
            });
        }
    }
}
