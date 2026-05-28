package dev.codecrafter.challenge.entity;

import dev.codecrafter.problem.entity.Problem;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "daily_challenges")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DailyChallenge {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false, unique = true)
    private LocalDate challengeDate;

    @Column(nullable = false)
    @Builder.Default
    private Integer bonusPoints = 10;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
