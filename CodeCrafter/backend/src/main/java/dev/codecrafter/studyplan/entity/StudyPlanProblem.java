package dev.codecrafter.studyplan.entity;

import dev.codecrafter.problem.entity.Problem;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "study_plan_problems",
    uniqueConstraints = @UniqueConstraint(columnNames = {"plan_id", "problem_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudyPlanProblem {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private StudyPlan plan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    @Column(columnDefinition = "TEXT")
    private String notes;
}
