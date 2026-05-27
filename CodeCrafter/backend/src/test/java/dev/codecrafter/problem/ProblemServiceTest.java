package dev.codecrafter.problem;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.problem.dto.PageResponse;
import dev.codecrafter.problem.dto.ProblemDetailDto;
import dev.codecrafter.problem.dto.ProblemListItemDto;
import dev.codecrafter.problem.dto.RunRequest;
import dev.codecrafter.problem.dto.RunResponse;
import dev.codecrafter.problem.entity.*;
import dev.codecrafter.problem.repository.*;
import dev.codecrafter.problem.sandbox.RunService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProblemServiceTest {

    @Mock ProblemRepository problemRepository;
    @Mock SampleTestCaseRepository sampleTestCaseRepository;
    @Mock RunService runService;

    @InjectMocks ProblemService problemService;

    private Problem twoSum;

    @BeforeEach
    void setUp() {
        Tag arrayTag = Tag.builder().id(1L).slug("array").name("Array").build();
        twoSum = Problem.builder()
            .id(1L).slug("two-sum").number(1).title("Two Sum")
            .difficulty(Difficulty.EASY)
            .bodyMarkdown("Given an array...")
            .acceptanceRate(new BigDecimal("49.50"))
            .timeLimitMs(2000).memoryLimitMb(256)
            .tags(new HashSet<>(Set.of(arrayTag)))
            .examples(new ArrayList<>())
            .sampleTestCases(new ArrayList<>())
            .testCases(new ArrayList<>())
            .languages(new ArrayList<>())
            .build();
    }

    @Test
    void listProblems_returnsPage() {
        when(problemRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(twoSum)));

        PageResponse<ProblemListItemDto> result =
            problemService.listProblems(null, null, null, false, "number", "asc", 0, 20);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).slug()).isEqualTo("two-sum");
        assertThat(result.content().get(0).difficulty()).isEqualTo("EASY");
    }

    @Test
    void getBySlug_found() {
        when(problemRepository.findBySlugAndActiveTrue("two-sum")).thenReturn(Optional.of(twoSum));

        ProblemDetailDto dto = problemService.getBySlug("two-sum");

        assertThat(dto.slug()).isEqualTo("two-sum");
        assertThat(dto.title()).isEqualTo("Two Sum");
        assertThat(dto.tags()).contains("Array");
    }

    @Test
    void getBySlug_notFound_throws404() {
        when(problemRepository.findBySlugAndActiveTrue("missing")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> problemService.getBySlug("missing"))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("not found");
    }

    @Test
    void getRandom_withDifficulty() {
        when(problemRepository.findRandomByDifficulty("EASY")).thenReturn(Optional.of(twoSum));

        ProblemDetailDto dto = problemService.getRandom("EASY");

        assertThat(dto.difficulty()).isEqualTo("EASY");
    }

    @Test
    void run_withCustomInput_delegatesToRunService() {
        when(problemRepository.findBySlugAndActiveTrue("two-sum")).thenReturn(Optional.of(twoSum));
        RunResponse expected = new RunResponse("ACCEPTED", List.of(), null);
        when(runService.runCustomInput(any(), any(), any())).thenReturn(expected);

        RunResponse result = problemService.run("two-sum",
            new RunRequest("python", "print(1)", "some input"));

        assertThat(result.verdict()).isEqualTo("ACCEPTED");
        verify(runService).runCustomInput("python", "print(1)", "some input");
    }

    @Test
    void run_withoutCustomInput_runsAgainstSamples() {
        when(problemRepository.findBySlugAndActiveTrue("two-sum")).thenReturn(Optional.of(twoSum));
        when(sampleTestCaseRepository.findByProblemIdOrderBySortOrderAsc(1L))
            .thenReturn(List.of());
        RunResponse expected = new RunResponse("ACCEPTED", List.of(), null);
        when(runService.runAgainstSamples(any(), any(), any())).thenReturn(expected);

        RunResponse result = problemService.run("two-sum",
            new RunRequest("python", "print(1)", null));

        verify(runService).runAgainstSamples(eq("python"), eq("print(1)"), any());
    }
}
