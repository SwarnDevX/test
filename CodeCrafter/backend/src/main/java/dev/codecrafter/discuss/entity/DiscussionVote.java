package dev.codecrafter.discuss.entity;

import dev.codecrafter.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "discussion_votes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DiscussionVote {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "discussion_id")
    private Discussion discussion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_id")
    private DiscussionReply reply;

    @Column(nullable = false)
    private Short value; // -1 or 1
}
