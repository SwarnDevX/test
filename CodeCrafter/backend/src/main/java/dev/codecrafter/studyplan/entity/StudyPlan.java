package dev.codecrafter.studyplan.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "study_plans")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudyPlan {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String slug;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 10)
    private String icon;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String difficulty = "MIXED";

    @Column(nullable = false)
    @Builder.Default
    private Integer problemCount = 0;

    private Integer estimatedDays;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isPublished = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @UpdateTimestamp
    private Instant updatedAt;
}
