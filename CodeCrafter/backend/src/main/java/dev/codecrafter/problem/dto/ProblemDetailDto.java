package dev.codecrafter.problem.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ProblemDetailDto(
    Long id,
    int number,
    String slug,
    String title,
    String difficulty,
    String bodyMarkdown,
    String constraintsMarkdown,
    String followUpMarkdown,
    BigDecimal acceptanceRate,
    int submissionCount,
    int likeCount,
    int dislikeCount,
    int timeLimitMs,
    int memoryLimitMb,
    boolean isPremium,
    List<ExampleDto> examples,
    List<String> tags,
    List<SampleTestCaseDto> sampleTestCases,
    Map<String, String> starterCode
) {
    public record ExampleDto(String input, String output, String explanation) {}
    public record SampleTestCaseDto(Long id, String input, String expectedOutput) {}
}
