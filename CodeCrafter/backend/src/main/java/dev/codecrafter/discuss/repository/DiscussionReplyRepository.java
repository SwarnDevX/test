package dev.codecrafter.discuss.repository;

import dev.codecrafter.discuss.entity.DiscussionReply;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DiscussionReplyRepository extends JpaRepository<DiscussionReply, Long> {
    Page<DiscussionReply> findByDiscussionIdAndParentIsNull(Long discussionId, Pageable pageable);
    List<DiscussionReply> findByParentIdOrderByCreatedAtAsc(Long parentId);
}
