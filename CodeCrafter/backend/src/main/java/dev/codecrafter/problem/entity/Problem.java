package dev.codecrafter.problem.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Entity
@Table(name = "problems")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Problem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 200)
    private String slug;

    @Column(nullable = false, unique = true)
    private int number;

    @Column(nullable = false, length = 300)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Difficulty difficulty;

    // Generated stored column — read-only
    @Column(name = "difficulty_order", insertable = false, updatable = false)
    private Integer difficultyOrder;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String bodyMarkdown;

    @Column(columnDefinition = "TEXT")
    private String constraintsMarkdown;

    @Column(columnDefinition = "TEXT")
    private String followUpMarkdown;

    @Column(nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal acceptanceRate = BigDecimal.ZERO;

    @Column(nullable = false)
    @Builder.Default
    private int submissionCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int likeCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int dislikeCount = 0;

    @Column(nullable = false)
    @Builder.Default
    private int timeLimitMs = 2000;

    @Column(nullable = false)
    @Builder.Default
    private int memoryLimitMb = 256;

    @Column(nullable = false)
    @Builder.Default
    private boolean isPremium = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "problem_tags",
        joinColumns = @JoinColumn(name = "problem_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @BatchSize(size = 30)
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "problem_companies",
        joinColumns = @JoinColumn(name = "problem_id"),
        inverseJoinColumns = @JoinColumn(name = "company_id")
    )
    @BatchSize(size = 30)
    @Builder.Default
    private Set<Company> companies = new HashSet<>();

    @OneToMany(mappedBy = "problem", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 20)
    @Builder.Default
    private List<ProblemExample> examples = new ArrayList<>();

    @OneToMany(mappedBy = "problem", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 20)
    @Builder.Default
    private List<SampleTestCase> sampleTestCases = new ArrayList<>();

    @OneToMany(mappedBy = "problem", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 50)
    @Builder.Default
    private List<TestCase> testCases = new ArrayList<>();

    @OneToMany(mappedBy = "problem", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    @BatchSize(size = 10)
    @Builder.Default
    private List<ProblemLanguage> languages = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
