package dev.codecrafter.contest.entity;

import dev.codecrafter.problem.entity.Problem;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "contest_problems",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"contest_id", "problem_id"}),
        @UniqueConstraint(columnNames = {"contest_id", "alias"})
    })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContestProblem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contest_id", nullable = false)
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false, length = 5)
    @Builder.Default
    private String alias = "A";

    @Column(nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer points = 100;
}
