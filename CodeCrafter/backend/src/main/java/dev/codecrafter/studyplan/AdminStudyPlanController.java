package dev.codecrafter.studyplan;

import dev.codecrafter.studyplan.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/study-plans")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminStudyPlanController {

    private final StudyPlanService studyPlanService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudyPlanSummaryDto create(@Valid @RequestBody CreateStudyPlanRequest req) {
        return studyPlanService.create(req);
    }

    @PutMapping("/{slug}")
    public StudyPlanSummaryDto update(
            @PathVariable String slug,
            @Valid @RequestBody CreateStudyPlanRequest req) {
        return studyPlanService.update(slug, req);
    }

    @PostMapping("/{slug}/problems")
    @ResponseStatus(HttpStatus.CREATED)
    public StudyPlanDetailDto addProblem(
            @PathVariable String slug,
            @Valid @RequestBody AddPlanProblemRequest req) {
        return studyPlanService.addProblem(slug, req);
    }

    @DeleteMapping("/{slug}/problems/{problemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeProblem(
            @PathVariable String slug,
            @PathVariable Long problemId) {
        studyPlanService.removeProblem(slug, problemId);
    }
}
