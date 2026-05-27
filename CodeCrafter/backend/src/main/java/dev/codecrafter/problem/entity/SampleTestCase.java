package dev.codecrafter.problem.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sample_test_cases")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SampleTestCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String input;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String expectedOutput;

    @Column(nullable = false)
    private int sortOrder;
}
