package dev.codecrafter.contest;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.contest.dto.*;
import dev.codecrafter.contest.entity.*;
import dev.codecrafter.contest.repository.*;
import dev.codecrafter.problem.dto.PageResponse;
import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.problem.repository.ProblemRepository;
import dev.codecrafter.user.entity.User;
import dev.codecrafter.user.entity.UserProfile;
import dev.codecrafter.user.repository.UserProfileRepository;
import dev.codecrafter.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ContestService {

    private final ContestRepository contestRepository;
    private final ContestProblemRepository contestProblemRepository;
    private final ContestParticipantRepository participantRepository;
    private final ContestSubmissionRepository contestSubmissionRepository;
    private final ContestRatingRepository ratingRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ContestLeaderboardService leaderboardService;
    private final RatingService ratingService;

    // ── Public API ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PageResponse<ContestDto> list(int page, int size, Long viewerUserId) {
        Page<Contest> contests = contestRepository
            .findByIsVisibleTrueOrderByStartTimeDesc(PageRequest.of(page, size));
        return PageResponse.of(contests.map(c -> toDto(c, viewerUserId)));
    }

    @Transactional(readOnly = true)
    public ContestDto getBySlug(String slug, Long viewerUserId) {
        Contest c = contestRepository.findBySlugAndIsVisibleTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Contest not found"));
        return toDto(c, viewerUserId);
    }

    @Transactional
    public ContestDto register(String slug, Long userId) {
        Contest contest = contestRepository.findBySlugAndIsVisibleTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Contest not found"));
        if (contest.getStatus() == ContestStatus.ENDED) {
            throw ApiException.badRequest("Contest has already ended");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        if (!participantRepository.existsByContestIdAndUserId(contest.getId(), userId)) {
            participantRepository.save(ContestParticipant.builder()
                .contest(contest).user(user).build());
        }
        return toDto(contest, userId);
    }

    @Transactional(readOnly = true)
    public List<ContestProblemDto> getProblems(String slug, Long viewerUserId) {
        Contest contest = contestRepository.findBySlugAndIsVisibleTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Contest not found"));

        if (!contest.hasStarted() && (viewerUserId == null || !isAdmin(viewerUserId))) {
            throw ApiException.forbidden("Contest has not started yet");
        }

        return contestProblemRepository.findByContestIdOrderByOrderIndexAsc(contest.getId())
            .stream().map(cp -> {
                boolean solved = viewerUserId != null &&
                    contestSubmissionRepository.existsByContestIdAndProblemIdAndUserIdAndIsAcceptedTrue(
                        contest.getId(), cp.getProblem().getId(), viewerUserId);
                long wa = viewerUserId != null
                    ? contestSubmissionRepository.countWrongAttempts(contest.getId(), cp.getProblem().getId(), viewerUserId)
                    : 0;
                return new ContestProblemDto(
                    cp.getProblem().getId(), cp.getAlias(), cp.getOrderIndex(), cp.getPoints(),
                    cp.getProblem().getTitle(), cp.getProblem().getSlug(),
                    cp.getProblem().getDifficulty().name(), solved, (int) wa
                );
            }).toList();
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> getLeaderboard(String slug) {
        Contest contest = contestRepository.findBySlugAndIsVisibleTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Contest not found"));

        return contest.getStatus() == ContestStatus.ENDED
            ? leaderboardService.getFromDb(contest.getId())
            : leaderboardService.getTop(contest.getId(), 200);
    }

    @Transactional(readOnly = true)
    public List<ContestRatingHistoryDto> getRatingHistory(Long userId) {
        return ratingService.getHistory(userId);
    }

    @Transactional(readOnly = true)
    public List<dev.codecrafter.submission.dto.SubmissionDto> getMySubmissions(String slug, Long userId) {
        Contest contest = contestRepository.findBySlugAndIsVisibleTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Contest not found"));
        return contestSubmissionRepository.findByContestIdAndUserId(contest.getId(), userId)
            .stream().map(cs -> toSubmissionDto(cs)).toList();
    }

    // ── Admin API ──────────────────────────────────────────────────────────────

    @Transactional
    public ContestDto create(CreateContestRequest req) {
        if (contestRepository.findBySlug(req.slug()).isPresent()) {
            throw ApiException.conflict("Contest slug already exists");
        }
        Contest contest = Contest.builder()
            .slug(req.slug()).title(req.title()).description(req.description())
            .type(req.type() != null ? req.type() : "SPECIAL")
            .startTime(req.startTime()).endTime(req.endTime())
            .isVisible(req.visible())
            .build();
        return toDto(contestRepository.save(contest), null);
    }

    @Transactional
    public ContestDto update(String slug, CreateContestRequest req) {
        Contest contest = contestRepository.findBySlug(slug)
            .orElseThrow(() -> ApiException.notFound("Contest not found"));
        contest.setTitle(req.title());
        contest.setDescription(req.description());
        if (req.type() != null) contest.setType(req.type());
        contest.setStartTime(req.startTime());
        contest.setEndTime(req.endTime());
        contest.setIsVisible(req.visible());
        return toDto(contestRepository.save(contest), null);
    }

    @Transactional
    public ContestDto addProblem(String slug, AddContestProblemRequest req) {
        Contest contest = contestRepository.findBySlug(slug)
            .orElseThrow(() -> ApiException.notFound("Contest not found"));
        Problem problem = problemRepository.findById(req.problemId())
            .orElseThrow(() -> ApiException.notFound("Problem not found"));

        if (contestProblemRepository.existsByContestIdAndProblemId(contest.getId(), problem.getId())) {
            throw ApiException.conflict("Problem already in contest");
        }
        int order = req.orderIndex() != null ? req.orderIndex()
            : (int) contestProblemRepository.findByContestIdOrderByOrderIndexAsc(contest.getId()).size();

        contestProblemRepository.save(ContestProblem.builder()
            .contest(contest).problem(problem)
            .alias(req.alias().toUpperCase())
            .orderIndex(order)
            .points(req.points() != null ? req.points() : 100)
            .build());

        return toDto(contest, null);
    }

    @Transactional
    public void removeProblem(String slug, Long problemId) {
        Contest contest = contestRepository.findBySlug(slug)
            .orElseThrow(() -> ApiException.notFound("Contest not found"));
        contestProblemRepository.findByContestIdAndProblemId(contest.getId(), problemId)
            .ifPresent(contestProblemRepository::delete);
    }

    @Transactional
    public ContestDto endContest(String slug) {
        Contest contest = contestRepository.findBySlug(slug)
            .orElseThrow(() -> ApiException.notFound("Contest not found"));
        contest.setStatus(ContestStatus.ENDED);
        contestRepository.save(contest);
        leaderboardService.finalizeLeaderboard(contest.getId());
        ratingService.computeRatings(contest);
        return toDto(contest, null);
    }

    /** Scheduled job: auto-transition contest status every minute. */
    @Scheduled(fixedDelay = 60_000)
    @Transactional
    public void syncContestStatus() {
        Instant now = Instant.now();
        contestRepository.findByStatus(ContestStatus.UPCOMING).forEach(c -> {
            if (now.isAfter(c.getStartTime())) {
                c.setStatus(ContestStatus.RUNNING);
                contestRepository.save(c);
                log.info("Contest '{}' started", c.getSlug());
            }
        });
        contestRepository.findByStatus(ContestStatus.RUNNING).forEach(c -> {
            if (now.isAfter(c.getEndTime())) {
                c.setStatus(ContestStatus.ENDED);
                contestRepository.save(c);
                leaderboardService.finalizeLeaderboard(c.getId());
                ratingService.computeRatings(c);
                log.info("Contest '{}' ended, ratings computed", c.getSlug());
            }
        });
    }

    // ── Contest submission recording (called from VerdictListener) ─────────────

    @Transactional
    public void onSubmissionVerdict(Long submissionId, Long userId, Long problemId, boolean accepted, Instant verdictAt) {
        contestProblemRepository.findActiveContestEntriesForProblem(problemId).stream()
            .filter(cp -> participantRepository.existsByContestIdAndUserId(cp.getContest().getId(), userId))
            .forEach(cp -> {
                Contest contest = cp.getContest();

                // Create or update ContestSubmission
                dev.codecrafter.submission.entity.Submission sub = new dev.codecrafter.submission.entity.Submission();
                sub.setId(submissionId);
                dev.codecrafter.problem.entity.Problem problem = cp.getProblem();
                dev.codecrafter.user.entity.User user = userRepository.findById(userId).orElseThrow();

                // Only record if problem not yet solved (for WA after AC, skip)
                boolean alreadySolved = contestSubmissionRepository
                    .existsByContestIdAndProblemIdAndUserIdAndIsAcceptedTrue(contest.getId(), problemId, userId);

                var existingSubmission = new dev.codecrafter.submission.entity.Submission();
                existingSubmission.setId(submissionId);

                if (accepted) {
                    if (!alreadySolved) {
                        // Find the real Submission entity
                        var realSub = findSubmission(submissionId);
                        contestSubmissionRepository.save(ContestSubmission.builder()
                            .contest(contest).submission(realSub).problem(problem).user(user)
                            .isAccepted(true).solvedAt(verdictAt).build());
                        leaderboardService.recordAccepted(contest, userId, problemId, verdictAt);
                    }
                } else {
                    if (!alreadySolved) {
                        var realSub = findSubmission(submissionId);
                        contestSubmissionRepository.save(ContestSubmission.builder()
                            .contest(contest).submission(realSub).problem(problem).user(user)
                            .isAccepted(false).build());
                        leaderboardService.recordWrongAttempt(contest.getId(), userId, problemId);
                    }
                }
            });
    }

    private dev.codecrafter.submission.entity.Submission findSubmission(Long id) {
        // Use a simple proxy — the entity only needs the id for FK
        var s = new dev.codecrafter.submission.entity.Submission();
        s.setId(id);
        return s;
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private ContestDto toDto(Contest c, Long viewerUserId) {
        long count = participantRepository.countByContestId(c.getId());
        boolean registered = viewerUserId != null &&
            participantRepository.existsByContestIdAndUserId(c.getId(), viewerUserId);
        return new ContestDto(
            c.getId(), c.getSlug(), c.getTitle(), c.getDescription(), c.getType(),
            c.getStartTime(), c.getEndTime(), c.getStatus().name(), count, registered
        );
    }

    private dev.codecrafter.submission.dto.SubmissionDto toSubmissionDto(ContestSubmission cs) {
        return new dev.codecrafter.submission.dto.SubmissionDto(
            cs.getSubmission().getId(),
            cs.getIsAccepted() ? "ACCEPTED" : "WRONG_ANSWER",
            cs.getSubmission().getLanguage(),
            cs.getSubmission().getRuntimeMs(),
            cs.getSubmission().getMemoryKb(),
            cs.getSubmission().getCreatedAt()
        );
    }

    private boolean isAdmin(Long userId) {
        return userRepository.findByIdWithRoles(userId)
            .map(u -> u.getRoles().stream().anyMatch(r -> r.getName().equals("ROLE_ADMIN")))
            .orElse(false);
    }
}
