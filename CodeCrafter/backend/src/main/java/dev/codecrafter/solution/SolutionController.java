package dev.codecrafter.solution;

import dev.codecrafter.problem.dto.PageResponse;
import dev.codecrafter.security.AppUserDetails;
import dev.codecrafter.solution.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SolutionController {

    private final SolutionService solutionService;

    @GetMapping("/problems/{slug}/solutions")
    public PageResponse<SolutionDto> list(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "voteScore") String sort,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sort));
        Page<SolutionDto> result = solutionService.listSolutions(slug, pageable, viewerId);
        return PageResponse.of(result);
    }

    @PostMapping("/problems/{slug}/solutions")
    @ResponseStatus(HttpStatus.CREATED)
    public SolutionDto create(
            @PathVariable String slug,
            @Valid @RequestBody CreateSolutionRequest req,
            @AuthenticationPrincipal AppUserDetails principal) {
        return solutionService.createSolution(slug, req, principal.getId());
    }

    @PostMapping("/solutions/{id}/vote")
    public SolutionDto vote(
            @PathVariable Long id,
            @RequestParam short value,
            @AuthenticationPrincipal AppUserDetails principal) {
        if (value != 1 && value != -1) throw dev.codecrafter.common.exception.ApiException.badRequest("value must be 1 or -1");
        return solutionService.vote(id, value, principal.getId());
    }

    @GetMapping("/solutions/{id}/comments")
    public List<SolutionCommentDto> listComments(
            @PathVariable Long id,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        return solutionService.listComments(id, viewerId);
    }

    @PostMapping("/solutions/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public SolutionCommentDto addComment(
            @PathVariable Long id,
            @Valid @RequestBody AddCommentRequest req,
            @AuthenticationPrincipal AppUserDetails principal) {
        return solutionService.addComment(id, req, principal.getId());
    }
}
