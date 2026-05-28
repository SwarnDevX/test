package dev.codecrafter.contest.entity;

import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.submission.entity.Submission;
import dev.codecrafter.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "contest_submissions",
    uniqueConstraints = @UniqueConstraint(columnNames = {"contest_id", "submission_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContestSubmission {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contest_id", nullable = false)
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "submission_id", nullable = false)
    private Submission submission;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isAccepted = false;

    private Instant solvedAt;
}
