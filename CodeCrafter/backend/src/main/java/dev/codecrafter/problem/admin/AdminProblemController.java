package dev.codecrafter.problem.admin;

import dev.codecrafter.problem.ProblemService;
import dev.codecrafter.problem.dto.PageResponse;
import dev.codecrafter.problem.dto.ProblemDetailDto;
import dev.codecrafter.problem.dto.ProblemListItemDto;
import dev.codecrafter.problem.entity.Problem;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/problems")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ROLE_ADMIN')")
@Tag(name = "Admin - Problems", description = "Problem management (admin only)")
public class AdminProblemController {

    private final AdminProblemService adminProblemService;
    private final ProblemService problemService;

    @GetMapping
    @Operation(summary = "List all problems including inactive (admin)")
    public PageResponse<ProblemListItemDto> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return problemService.listProblems(null, null, null, false, "number", "asc", page, size);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a new problem with examples, test cases, and starter code")
    public ProblemDetailDto create(@Valid @RequestBody CreateProblemRequest req) {
        adminProblemService.createProblem(req);
        return problemService.getBySlug(req.slug());
    }

    @PatchMapping("/{slug}/toggle-active")
    @Operation(summary = "Enable or disable a problem")
    public Map<String, String> toggleActive(
            @PathVariable String slug,
            @RequestParam boolean active) {
        adminProblemService.toggleActive(slug, active);
        return Map.of("message", "Problem " + (active ? "activated" : "deactivated"));
    }
}
