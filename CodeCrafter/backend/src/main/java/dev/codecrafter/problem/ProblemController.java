package dev.codecrafter.problem;

import dev.codecrafter.infra.redis.RateLimiterService;
import dev.codecrafter.problem.dto.*;
import dev.codecrafter.security.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/v1/problems")
@RequiredArgsConstructor
@Tag(name = "Problems", description = "Problem browsing and code execution")
public class ProblemController {

    private final ProblemService problemService;
    private final RateLimiterService rateLimiter;

    @GetMapping
    @Operation(summary = "List problems with optional filters and pagination")
    public PageResponse<ProblemListItemDto> listProblems(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) List<String> tags,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "false") boolean premiumOnly,
            @RequestParam(defaultValue = "number") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return problemService.listProblems(difficulty, tags, search, premiumOnly,
            sortBy, sortDir, page, size);
    }

    @GetMapping("/random")
    @Operation(summary = "Get a random active problem (respects difficulty filter)")
    public ProblemDetailDto random(@RequestParam(required = false) String difficulty) {
        return problemService.getRandom(difficulty);
    }

    @GetMapping("/{slug}")
    @Operation(summary = "Get full problem detail by slug")
    public ProblemDetailDto getBySlug(@PathVariable String slug) {
        return problemService.getBySlug(slug);
    }

    @PostMapping("/{slug}/run")
    @Operation(summary = "Run code against sample test cases (30 runs/min per user)")
    public RunResponse run(
            @PathVariable String slug,
            @Valid @RequestBody RunRequest req,
            @AuthenticationPrincipal AppUserDetails principal) {

        if (principal != null) {
            rateLimiter.isUserAllowed(principal.getId(), "run", 30, Duration.ofMinutes(1));
        }
        return problemService.run(slug, req);
    }
}
