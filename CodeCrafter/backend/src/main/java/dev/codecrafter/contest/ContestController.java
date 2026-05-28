package dev.codecrafter.contest;

import dev.codecrafter.contest.dto.*;
import dev.codecrafter.problem.dto.PageResponse;
import dev.codecrafter.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/v1/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestService contestService;

    @GetMapping
    public PageResponse<ContestDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        return contestService.list(page, size, viewerId);
    }

    @GetMapping("/{slug}")
    public ContestDto get(
            @PathVariable String slug,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        return contestService.getBySlug(slug, viewerId);
    }

    @PostMapping("/{slug}/register")
    public ContestDto register(
            @PathVariable String slug,
            @AuthenticationPrincipal AppUserDetails principal) {
        return contestService.register(slug, principal.getId());
    }

    @GetMapping("/{slug}/problems")
    public List<ContestProblemDto> getProblems(
            @PathVariable String slug,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        return contestService.getProblems(slug, viewerId);
    }

    @GetMapping("/{slug}/leaderboard")
    public List<LeaderboardEntryDto> getLeaderboard(@PathVariable String slug) {
        return contestService.getLeaderboard(slug);
    }

    @GetMapping("/{slug}/my-submissions")
    public List<dev.codecrafter.submission.dto.SubmissionDto> getMySubmissions(
            @PathVariable String slug,
            @AuthenticationPrincipal AppUserDetails principal) {
        return contestService.getMySubmissions(slug, principal.getId());
    }

    @GetMapping("/rating-history")
    public List<ContestRatingHistoryDto> getRatingHistory(
            @AuthenticationPrincipal AppUserDetails principal) {
        return contestService.getRatingHistory(principal.getId());
    }
}
