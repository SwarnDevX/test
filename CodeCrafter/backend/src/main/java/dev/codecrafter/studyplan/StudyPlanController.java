package dev.codecrafter.studyplan;

import dev.codecrafter.security.AppUserDetails;
import dev.codecrafter.studyplan.dto.StudyPlanDetailDto;
import dev.codecrafter.studyplan.dto.StudyPlanSummaryDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/study-plans")
@RequiredArgsConstructor
public class StudyPlanController {

    private final StudyPlanService studyPlanService;

    @GetMapping
    public List<StudyPlanSummaryDto> list(@AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        return studyPlanService.listPublished(viewerId);
    }

    @GetMapping("/{slug}")
    public StudyPlanDetailDto detail(
            @PathVariable String slug,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        return studyPlanService.getDetail(slug, viewerId);
    }
}
