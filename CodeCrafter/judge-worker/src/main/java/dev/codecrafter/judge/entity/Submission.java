package dev.codecrafter.judge.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "submissions")
@Getter @Setter @NoArgsConstructor
public class Submission {

    @Id
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "problem_id", nullable = false)
    private Long problemId;

    @Column(nullable = false, length = 20)
    private String language;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String sourceCode;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(length = 30)
    private String verdict;

    private Integer runtimeMs;
    private Integer memoryKb;
    private Integer testcasesPassed;
    private Integer totalTestcases;
    private Integer failingTestcaseIndex;

    @Column(columnDefinition = "TEXT")
    private String compileError;

    @Column(columnDefinition = "TEXT")
    private String stdout;

    @Column(columnDefinition = "TEXT")
    private String stderr;

    private Instant createdAt;
    private Instant updatedAt;
}
