package dev.codecrafter.submission;

import dev.codecrafter.infra.redis.RateLimiterService;
import dev.codecrafter.problem.dto.PageResponse;
import dev.codecrafter.security.AppUserDetails;
import dev.codecrafter.submission.dto.SubmissionDetailDto;
import dev.codecrafter.submission.dto.SubmissionDto;
import dev.codecrafter.submission.dto.SubmitRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;
    private final RateLimiterService rateLimiter;

    @PostMapping("/problems/{slug}/submit")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public SubmissionDto submit(
            @PathVariable String slug,
            @Valid @RequestBody SubmitRequest req,
            @AuthenticationPrincipal AppUserDetails principal) {
        if (!rateLimiter.isUserAllowed(principal.getId(), "submit", 5, java.time.Duration.ofMinutes(1))) {
            throw dev.codecrafter.common.exception.ApiException.tooManyRequests("Submission rate limit exceeded (5/min)");
        }
        return submissionService.submit(slug, req, principal.getId());
    }

    @GetMapping("/problems/{slug}/submissions")
    public PageResponse<SubmissionDto> listForProblem(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AppUserDetails principal) {
        Page<SubmissionDto> result = submissionService.listForProblem(slug, principal.getId(), page, size);
        return PageResponse.of(result);
    }

    @GetMapping("/submissions")
    public PageResponse<SubmissionDto> listMySubmissions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AppUserDetails principal) {
        Page<SubmissionDto> result = submissionService.listForUser(principal.getId(), page, size);
        return PageResponse.of(result);
    }

    @GetMapping("/submissions/{id}")
    public SubmissionDetailDto getSubmission(
            @PathVariable Long id,
            @AuthenticationPrincipal AppUserDetails principal) {
        return submissionService.getById(id, principal.getId());
    }
}
