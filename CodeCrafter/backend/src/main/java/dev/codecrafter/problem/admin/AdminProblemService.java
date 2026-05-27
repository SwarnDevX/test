package dev.codecrafter.problem.admin;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.problem.entity.*;
import dev.codecrafter.problem.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AdminProblemService {

    private final ProblemRepository problemRepository;
    private final TagRepository tagRepository;
    private final SampleTestCaseRepository sampleTestCaseRepository;
    private final TestCaseRepository testCaseRepository;
    private final ProblemLanguageRepository problemLanguageRepository;

    @Transactional
    public Problem createProblem(CreateProblemRequest req) {
        if (problemRepository.existsBySlug(req.slug())) {
            throw ApiException.conflict("Slug already in use: " + req.slug());
        }
        if (problemRepository.existsByNumber(req.number())) {
            throw ApiException.conflict("Problem number already in use: " + req.number());
        }

        Difficulty difficulty;
        try {
            difficulty = Difficulty.valueOf(req.difficulty().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Invalid difficulty: " + req.difficulty());
        }

        Problem problem = Problem.builder()
            .slug(req.slug())
            .number(req.number())
            .title(req.title())
            .difficulty(difficulty)
            .bodyMarkdown(req.bodyMarkdown())
            .constraintsMarkdown(req.constraintsMarkdown())
            .followUpMarkdown(req.followUpMarkdown())
            .timeLimitMs(req.timeLimitMs() > 0 ? req.timeLimitMs() : 2000)
            .memoryLimitMb(req.memoryLimitMb() > 0 ? req.memoryLimitMb() : 256)
            .isPremium(req.isPremium())
            .build();

        // Attach tags
        if (req.tagSlugs() != null && !req.tagSlugs().isEmpty()) {
            List<Tag> tags = tagRepository.findBySlugIn(req.tagSlugs());
            problem.getTags().addAll(tags);
        }

        problem = problemRepository.save(problem);

        // Examples
        if (req.examples() != null) {
            for (var ex : req.examples()) {
                ProblemExample example = ProblemExample.builder()
                    .problem(problem)
                    .input(ex.input())
                    .output(ex.output())
                    .explanation(ex.explanation())
                    .sortOrder(ex.sortOrder())
                    .build();
                problem.getExamples().add(example);
            }
            problemRepository.save(problem);
        }

        // Sample test cases
        if (req.sampleTestCases() != null) {
            for (var tc : req.sampleTestCases()) {
                sampleTestCaseRepository.save(SampleTestCase.builder()
                    .problem(problem)
                    .input(tc.input())
                    .expectedOutput(tc.expectedOutput())
                    .sortOrder(tc.sortOrder())
                    .build());
                testCaseRepository.save(TestCase.builder()
                    .problem(problem)
                    .input(tc.input())
                    .expectedOutput(tc.expectedOutput())
                    .sortOrder(tc.sortOrder())
                    .isSample(true)
                    .build());
            }
        }

        // Hidden test cases
        if (req.hiddenTestCases() != null) {
            for (var tc : req.hiddenTestCases()) {
                testCaseRepository.save(TestCase.builder()
                    .problem(problem)
                    .input(tc.input())
                    .expectedOutput(tc.expectedOutput())
                    .sortOrder(tc.sortOrder())
                    .isSample(false)
                    .build());
            }
        }

        // Starter code per language
        if (req.starterCode() != null) {
            for (var entry : req.starterCode().entrySet()) {
                problemLanguageRepository.save(ProblemLanguage.builder()
                    .problem(problem)
                    .language(entry.getKey())
                    .starterCode(entry.getValue())
                    .build());
            }
        }

        return problem;
    }

    @Transactional
    public void toggleActive(String slug, boolean active) {
        Problem problem = problemRepository.findBySlugAndActiveTrue(slug)
            .or(() -> problemRepository.findAll().stream()
                .filter(p -> p.getSlug().equals(slug)).findFirst())
            .orElseThrow(() -> ApiException.notFound("Problem not found: " + slug));
        problem.setActive(active);
        problemRepository.save(problem);
    }
}
