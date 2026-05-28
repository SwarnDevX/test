package dev.codecrafter.admin;

import dev.codecrafter.challenge.repository.DailyChallengeRepository;
import dev.codecrafter.contest.entity.ContestStatus;
import dev.codecrafter.contest.repository.ContestRepository;
import dev.codecrafter.problem.repository.ProblemRepository;
import dev.codecrafter.submission.repository.SubmissionRepository;
import dev.codecrafter.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminStatsController {

    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final ContestRepository contestRepository;
    private final SubmissionRepository submissionRepository;
    private final DailyChallengeRepository dailyChallengeRepository;

    @GetMapping
    public Map<String, Object> stats() {
        long totalProblems  = problemRepository.count();
        long activeProblems = problemRepository.countByActiveTrue();
        long totalUsers     = userRepository.count();
        long activeContests = contestRepository.findByStatus(ContestStatus.RUNNING).size();
        long totalSubs      = submissionRepository.count();
        boolean todaySet    = dailyChallengeRepository.findByChallengeDate(LocalDate.now()).isPresent();

        return Map.of(
            "totalProblems",   totalProblems,
            "activeProblems",  activeProblems,
            "totalUsers",      totalUsers,
            "activeContests",  activeContests,
            "totalSubmissions", totalSubs,
            "todayChallengeSet", todaySet
        );
    }
}
