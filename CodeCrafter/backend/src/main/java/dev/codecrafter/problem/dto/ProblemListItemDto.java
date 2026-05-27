package dev.codecrafter.problem.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProblemListItemDto(
    Long id,
    int number,
    String slug,
    String title,
    String difficulty,
    BigDecimal acceptanceRate,
    List<String> tags,
    String status   // "SOLVED" | "ATTEMPTED" | "TODO"
) {}
