package dev.codecrafter.solution.entity;

import dev.codecrafter.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "solution_votes",
    uniqueConstraints = @UniqueConstraint(columnNames = {"solution_id", "user_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SolutionVote {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "solution_id", nullable = false)
    private Solution solution;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Short value; // -1 or 1
}
