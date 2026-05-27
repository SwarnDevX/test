package dev.codecrafter.stats.entity;

import dev.codecrafter.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "user_activity",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "activity_date"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserActivity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate activityDate;

    @Builder.Default
    private int acCount = 0;
}
