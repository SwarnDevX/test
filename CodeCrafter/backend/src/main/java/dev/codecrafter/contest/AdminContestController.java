package dev.codecrafter.contest;

import dev.codecrafter.contest.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/contests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminContestController {

    private final ContestService contestService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ContestDto create(@Valid @RequestBody CreateContestRequest req) {
        return contestService.create(req);
    }

    @PutMapping("/{slug}")
    public ContestDto update(
            @PathVariable String slug,
            @Valid @RequestBody CreateContestRequest req) {
        return contestService.update(slug, req);
    }

    @PostMapping("/{slug}/problems")
    @ResponseStatus(HttpStatus.CREATED)
    public ContestDto addProblem(
            @PathVariable String slug,
            @Valid @RequestBody AddContestProblemRequest req) {
        return contestService.addProblem(slug, req);
    }

    @DeleteMapping("/{slug}/problems/{problemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeProblem(
            @PathVariable String slug,
            @PathVariable Long problemId) {
        contestService.removeProblem(slug, problemId);
    }

    @PostMapping("/{slug}/end")
    public ContestDto endContest(@PathVariable String slug) {
        return contestService.endContest(slug);
    }
}
