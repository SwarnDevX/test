package dev.codecrafter.studyplan.entity;

import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_study_plan_progress",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "plan_id", "problem_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserStudyPlanProgress {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id", nullable = false)
    private StudyPlan plan;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false)
    @Builder.Default
    private Instant completedAt = Instant.now();
}
