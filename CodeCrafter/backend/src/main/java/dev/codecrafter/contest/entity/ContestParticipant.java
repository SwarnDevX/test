package dev.codecrafter.contest.entity;

import dev.codecrafter.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "contest_participants",
    uniqueConstraints = @UniqueConstraint(columnNames = {"contest_id", "user_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ContestParticipant {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "contest_id", nullable = false)
    private Contest contest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private Instant registeredAt = Instant.now();

    @Column(nullable = false)
    @Builder.Default
    private Integer solvedCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer penaltySecs = 0;

    private Integer finalRank;
    private Integer ratingChange;
}
