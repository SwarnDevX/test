package dev.codecrafter.problem.admin;

import jakarta.validation.constraints.*;

import java.util.List;
import java.util.Map;

public record CreateProblemRequest(
    @NotBlank @Size(max = 300) String title,
    @NotNull @Positive Integer number,
    @NotBlank @Size(max = 200) String slug,
    @NotBlank String difficulty,
    @NotBlank String bodyMarkdown,
    String constraintsMarkdown,
    String followUpMarkdown,
    int timeLimitMs,
    int memoryLimitMb,
    boolean isPremium,
    List<String> tagSlugs,
    List<ExampleData> examples,
    List<TestCaseData> sampleTestCases,
    List<TestCaseData> hiddenTestCases,
    Map<String, String> starterCode
) {
    public record ExampleData(String input, String output, String explanation, int sortOrder) {}
    public record TestCaseData(String input, String expectedOutput, int sortOrder) {}
}
