package dev.codecrafter.problem;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.problem.dto.*;
import dev.codecrafter.problem.dto.ProblemDetailDto.ExampleDto;
import dev.codecrafter.problem.dto.ProblemDetailDto.SampleTestCaseDto;
import dev.codecrafter.problem.entity.*;
import dev.codecrafter.problem.repository.*;
import dev.codecrafter.problem.sandbox.RunService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProblemService {

    private final ProblemRepository problemRepository;
    private final SampleTestCaseRepository sampleTestCaseRepository;
    private final RunService runService;

    @Transactional(readOnly = true)
    public PageResponse<ProblemListItemDto> listProblems(
            String difficulty, List<String> tags, String search,
            boolean premiumOnly, String sortBy, String sortDir, int page, int size) {

        Specification<Problem> spec = ProblemSpecifications.isActive();

        if (difficulty != null && !difficulty.isBlank()) {
            try {
                spec = spec.and(ProblemSpecifications.hasDifficulty(
                    Difficulty.valueOf(difficulty.toUpperCase())));
            } catch (IllegalArgumentException ignored) {}
        }
        if (tags != null && !tags.isEmpty()) {
            spec = spec.and(ProblemSpecifications.hasAnyTagSlug(tags));
        }
        if (search != null && !search.isBlank()) {
            spec = spec.and(ProblemSpecifications.titleOrNumberContains(search.trim()));
        }
        if (premiumOnly) {
            spec = spec.and(ProblemSpecifications.isPremium(true));
        }

        Sort sort = buildSort(sortBy, sortDir);
        Pageable pageable = PageRequest.of(page, Math.min(size, 50), sort);

        Page<Problem> result = problemRepository.findAll(spec, pageable);
        return PageResponse.of(result.map(this::toListItemDto));
    }

    @Transactional(readOnly = true)
    public ProblemDetailDto getBySlug(String slug) {
        Problem p = problemRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Problem not found"));
        return toDetailDto(p);
    }

    @Transactional(readOnly = true)
    public ProblemDetailDto getRandom(String difficulty) {
        Problem p = (difficulty != null && !difficulty.isBlank())
            ? problemRepository.findRandomByDifficulty(difficulty.toUpperCase())
                .orElseThrow(() -> ApiException.notFound("No problems found for difficulty: " + difficulty))
            : problemRepository.findRandom()
                .orElseThrow(() -> ApiException.notFound("No active problems found"));
        return toDetailDto(p);
    }

    public RunResponse run(String slug, RunRequest req) {
        Problem problem = problemRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Problem not found"));

        if (req.customInput() != null) {
            return runService.runCustomInput(req.language(), req.sourceCode(), req.customInput());
        }
        List<SampleTestCase> samples = sampleTestCaseRepository
            .findByProblemIdOrderBySortOrderAsc(problem.getId());
        return runService.runAgainstSamples(req.language(), req.sourceCode(), samples);
    }

    // ── mapping ──────────────────────────────────────────────────────────────

    private ProblemListItemDto toListItemDto(Problem p) {
        List<String> tagNames = p.getTags().stream()
            .map(Tag::getName).sorted().collect(Collectors.toList());
        return new ProblemListItemDto(
            p.getId(), p.getNumber(), p.getSlug(), p.getTitle(),
            p.getDifficulty().name(),
            p.getAcceptanceRate(),
            tagNames,
            "TODO"   // status per user computed in Phase 3
        );
    }

    private ProblemDetailDto toDetailDto(Problem p) {
        List<ExampleDto> examples = p.getExamples().stream()
            .map(e -> new ExampleDto(e.getInput(), e.getOutput(), e.getExplanation()))
            .toList();

        List<SampleTestCaseDto> samples = p.getSampleTestCases().stream()
            .map(s -> new SampleTestCaseDto(s.getId(), s.getInput(), s.getExpectedOutput()))
            .toList();

        List<String> tagNames = p.getTags().stream()
            .map(Tag::getName).sorted().toList();

        Map<String, String> starterCode = p.getLanguages().stream()
            .collect(Collectors.toMap(ProblemLanguage::getLanguage, ProblemLanguage::getStarterCode));

        return new ProblemDetailDto(
            p.getId(), p.getNumber(), p.getSlug(), p.getTitle(),
            p.getDifficulty().name(),
            p.getBodyMarkdown(), p.getConstraintsMarkdown(), p.getFollowUpMarkdown(),
            p.getAcceptanceRate(), p.getSubmissionCount(),
            p.getLikeCount(), p.getDislikeCount(),
            p.getTimeLimitMs(), p.getMemoryLimitMb(),
            p.isPremium(),
            examples, tagNames, samples, starterCode
        );
    }

    private Sort buildSort(String sortBy, String dir) {
        Sort.Direction direction = "desc".equalsIgnoreCase(dir)
            ? Sort.Direction.DESC : Sort.Direction.ASC;
        String field = switch (sortBy == null ? "number" : sortBy.toLowerCase()) {
            case "title"      -> "title";
            case "difficulty" -> "difficultyOrder";
            case "acceptance" -> "acceptanceRate";
            default           -> "number";
        };
        return Sort.by(direction, field);
    }
}
