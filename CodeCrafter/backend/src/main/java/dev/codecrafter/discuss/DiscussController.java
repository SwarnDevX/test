package dev.codecrafter.discuss;

import dev.codecrafter.discuss.dto.*;
import dev.codecrafter.problem.dto.PageResponse;
import dev.codecrafter.security.AppUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DiscussController {

    private final DiscussService discussService;

    // ── Global forum ──────────────────────────────────────────────────

    @GetMapping("/discuss")
    public PageResponse<DiscussionDto> listGlobal(
            @RequestParam(required = false) String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<DiscussionDto> result = discussService.listGlobal(category, pageable, viewerId);
        return PageResponse.of(result);
    }

    @PostMapping("/discuss")
    @ResponseStatus(HttpStatus.CREATED)
    public DiscussionDto createGlobal(
            @Valid @RequestBody CreateDiscussionRequest req,
            @AuthenticationPrincipal AppUserDetails principal) {
        return discussService.createGlobal(req, principal.getId());
    }

    @GetMapping("/discuss/{id}")
    public DiscussionDto getById(
            @PathVariable Long id,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        return discussService.getById(id, viewerId);
    }

    @PostMapping("/discuss/{id}/vote")
    public DiscussionDto voteDiscussion(
            @PathVariable Long id,
            @RequestParam short value,
            @AuthenticationPrincipal AppUserDetails principal) {
        if (value != 1 && value != -1) throw dev.codecrafter.common.exception.ApiException.badRequest("value must be 1 or -1");
        return discussService.voteDiscussion(id, value, principal.getId());
    }

    @GetMapping("/discuss/{id}/replies")
    public PageResponse<DiscussionReplyDto> listReplies(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "createdAt"));
        return PageResponse.of(discussService.listReplies(id, pageable, viewerId));
    }

    @PostMapping("/discuss/{id}/replies")
    @ResponseStatus(HttpStatus.CREATED)
    public DiscussionReplyDto addReply(
            @PathVariable Long id,
            @Valid @RequestBody AddReplyRequest req,
            @AuthenticationPrincipal AppUserDetails principal) {
        return discussService.addReply(id, req, principal.getId());
    }

    @PostMapping("/discuss/replies/{replyId}/mark-answer")
    public DiscussionReplyDto markAnswer(
            @PathVariable Long replyId,
            @AuthenticationPrincipal AppUserDetails principal) {
        return discussService.markAnswer(replyId, principal.getId());
    }

    // ── Per-problem discussion ─────────────────────────────────────────

    @GetMapping("/problems/{slug}/discuss")
    public PageResponse<DiscussionDto> listForProblem(
            @PathVariable String slug,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.of(discussService.listForProblem(slug, pageable, viewerId));
    }

    @PostMapping("/problems/{slug}/discuss")
    @ResponseStatus(HttpStatus.CREATED)
    public DiscussionDto createForProblem(
            @PathVariable String slug,
            @Valid @RequestBody CreateDiscussionRequest req,
            @AuthenticationPrincipal AppUserDetails principal) {
        return discussService.create(slug, req, principal.getId());
    }
}
