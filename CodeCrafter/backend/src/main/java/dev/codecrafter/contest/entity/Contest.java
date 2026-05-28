package dev.codecrafter.contest.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "contests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Contest {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String type = "SPECIAL";

    @Column(nullable = false)
    private Instant startTime;

    @Column(nullable = false)
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ContestStatus status = ContestStatus.UPCOMING;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isVisible = true;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @UpdateTimestamp
    private Instant updatedAt;

    public boolean isRunning() {
        Instant now = Instant.now();
        return now.isAfter(startTime) && now.isBefore(endTime);
    }

    public boolean hasStarted() {
        return Instant.now().isAfter(startTime);
    }
}
