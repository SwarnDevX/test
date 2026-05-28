package dev.codecrafter.discuss.entity;

import dev.codecrafter.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "discussion_replies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DiscussionReply {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "discussion_id", nullable = false)
    private Discussion discussion;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private DiscussionReply parent;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contentMarkdown;

    @Column(nullable = false)
    @Builder.Default
    private Integer voteScore = 0;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isAnswer = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @UpdateTimestamp
    private Instant updatedAt;
}
