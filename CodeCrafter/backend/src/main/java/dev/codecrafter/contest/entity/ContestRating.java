package dev.codecrafter.contest.entity;

import dev.codecrafter.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "contest_ratings",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "contest_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContestRating {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contest_id", nullable = false)
    private Contest contest;

    @Column(nullable = false)
    @Builder.Default
    private Integer oldRating = 1500;

    @Column(nullable = false)
    @Builder.Default
    private Integer newRating = 1500;

    @Column(nullable = false)
    private Integer rank;

    @Column(nullable = false)
    private Integer participantCount;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
