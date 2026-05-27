package dev.codecrafter.stats.entity;

import dev.codecrafter.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "user_badges",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "badge_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserBadge {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "badge_id", nullable = false)
    private Badge badge;

    @Builder.Default
    private Instant awardedAt = Instant.now();
}
