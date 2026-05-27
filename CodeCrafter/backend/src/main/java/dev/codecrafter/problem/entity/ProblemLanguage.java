package dev.codecrafter.problem.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name = "problem_languages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ProblemLanguage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false, length = 20)
    private String language;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String starterCode;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
