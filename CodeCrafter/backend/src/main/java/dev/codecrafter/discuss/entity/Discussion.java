package dev.codecrafter.discuss.entity;

import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "discussions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Discussion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id")
    private Problem problem;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contentMarkdown;

    @Column(nullable = false, length = 30)
    @Builder.Default
    private String category = "GENERAL";

    @Column(nullable = false)
    @Builder.Default
    private Integer voteScore = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer replyCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isAnswered = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @UpdateTimestamp
    private Instant updatedAt;
}
