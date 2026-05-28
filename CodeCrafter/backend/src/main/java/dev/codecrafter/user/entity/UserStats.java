package dev.codecrafter.user.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "user_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Builder.Default
    private int easySolved = 0;

    @Builder.Default
    private int mediumSolved = 0;

    @Builder.Default
    private int hardSolved = 0;

    @Builder.Default
    private int totalSolved = 0;

    @Builder.Default
    private int currentStreak = 0;

    @Builder.Default
    private int longestStreak = 0;

    private Integer ranking;

    @Builder.Default
    private int reputation = 0;

    @Builder.Default
    private int contestRating = 1500;

    @Builder.Default
    private int contestsParticipated = 0;

    private LocalDate lastActiveDate;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
