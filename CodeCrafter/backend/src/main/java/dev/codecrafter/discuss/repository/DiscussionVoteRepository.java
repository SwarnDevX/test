package dev.codecrafter.discuss.repository;

import dev.codecrafter.discuss.entity.DiscussionVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface DiscussionVoteRepository extends JpaRepository<DiscussionVote, Long> {
    Optional<DiscussionVote> findByUserIdAndDiscussionId(Long userId, Long discussionId);
    Optional<DiscussionVote> findByUserIdAndReplyId(Long userId, Long replyId);

    @Modifying
    @Query("DELETE FROM DiscussionVote v WHERE v.user.id = :userId AND v.discussion.id = :discussionId")
    void deleteByUserIdAndDiscussionId(Long userId, Long discussionId);

    @Modifying
    @Query("DELETE FROM DiscussionVote v WHERE v.user.id = :userId AND v.reply.id = :replyId")
    void deleteByUserIdAndReplyId(Long userId, Long replyId);
}
