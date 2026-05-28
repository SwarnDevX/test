package dev.codecrafter.discuss;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.discuss.dto.*;
import dev.codecrafter.discuss.entity.Discussion;
import dev.codecrafter.discuss.entity.DiscussionReply;
import dev.codecrafter.discuss.entity.DiscussionVote;
import dev.codecrafter.discuss.repository.DiscussionReplyRepository;
import dev.codecrafter.discuss.repository.DiscussionRepository;
import dev.codecrafter.discuss.repository.DiscussionVoteRepository;
import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.problem.repository.ProblemRepository;
import dev.codecrafter.user.entity.User;
import dev.codecrafter.user.entity.UserProfile;
import dev.codecrafter.user.repository.UserProfileRepository;
import dev.codecrafter.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DiscussService {

    private final DiscussionRepository discussionRepository;
    private final DiscussionReplyRepository replyRepository;
    private final DiscussionVoteRepository voteRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public Page<DiscussionDto> listGlobal(String category, Pageable pageable, Long viewerUserId) {
        Page<Discussion> page = (category == null || category.isBlank())
            ? discussionRepository.findByProblemIsNull(pageable)
            : discussionRepository.findByProblemIsNullAndCategory(category, pageable);
        return page.map(d -> toDto(d, viewerUserId));
    }

    @Transactional(readOnly = true)
    public Page<DiscussionDto> listForProblem(String slug, Pageable pageable, Long viewerUserId) {
        Problem problem = problemRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Problem not found"));
        return discussionRepository.findByProblemId(problem.getId(), pageable)
            .map(d -> toDto(d, viewerUserId));
    }

    @Transactional(readOnly = true)
    public DiscussionDto getById(Long id, Long viewerUserId) {
        Discussion d = discussionRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Discussion not found"));
        return toDto(d, viewerUserId);
    }

    @Transactional
    public DiscussionDto create(String slug, CreateDiscussionRequest req, Long userId) {
        Problem problem = slug != null
            ? problemRepository.findBySlugAndActiveTrue(slug)
                .orElseThrow(() -> ApiException.notFound("Problem not found"))
            : null;
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        String category = (req.category() != null && !req.category().isBlank())
            ? req.category().toUpperCase() : "GENERAL";

        Discussion discussion = Discussion.builder()
            .problem(problem).user(user)
            .title(req.title())
            .contentMarkdown(req.contentMarkdown())
            .category(category)
            .build();

        return toDto(discussionRepository.save(discussion), userId);
    }

    @Transactional
    public DiscussionDto createGlobal(CreateDiscussionRequest req, Long userId) {
        return create(null, req, userId);
    }

    @Transactional
    public DiscussionDto voteDiscussion(Long discussionId, short value, Long userId) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> ApiException.notFound("Discussion not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        voteRepository.findByUserIdAndDiscussionId(userId, discussionId).ifPresentOrElse(
            existing -> {
                if (existing.getValue() == value) {
                    voteRepository.delete(existing);
                    discussion.setVoteScore(discussion.getVoteScore() - value);
                } else {
                    int delta = value - existing.getValue();
                    existing.setValue(value);
                    voteRepository.save(existing);
                    discussion.setVoteScore(discussion.getVoteScore() + delta);
                }
            },
            () -> {
                DiscussionVote vote = DiscussionVote.builder()
                    .user(user).discussion(discussion).value(value).build();
                voteRepository.save(vote);
                discussion.setVoteScore(discussion.getVoteScore() + value);
            }
        );

        return toDto(discussionRepository.save(discussion), userId);
    }

    @Transactional(readOnly = true)
    public Page<DiscussionReplyDto> listReplies(Long discussionId, Pageable pageable, Long viewerUserId) {
        discussionRepository.findById(discussionId)
            .orElseThrow(() -> ApiException.notFound("Discussion not found"));
        return replyRepository.findByDiscussionIdAndParentIsNull(discussionId, pageable)
            .map(r -> toReplyDto(r, viewerUserId));
    }

    @Transactional
    public DiscussionReplyDto addReply(Long discussionId, AddReplyRequest req, Long userId) {
        Discussion discussion = discussionRepository.findById(discussionId)
            .orElseThrow(() -> ApiException.notFound("Discussion not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        DiscussionReply parent = null;
        if (req.parentId() != null) {
            parent = replyRepository.findById(req.parentId())
                .orElseThrow(() -> ApiException.notFound("Parent reply not found"));
        }

        DiscussionReply reply = DiscussionReply.builder()
            .discussion(discussion).user(user).parent(parent)
            .contentMarkdown(req.contentMarkdown())
            .build();

        discussion.setReplyCount(discussion.getReplyCount() + 1);
        discussionRepository.save(discussion);

        return toReplyDto(replyRepository.save(reply), userId);
    }

    @Transactional
    public DiscussionReplyDto markAnswer(Long replyId, Long userId) {
        DiscussionReply reply = replyRepository.findById(replyId)
            .orElseThrow(() -> ApiException.notFound("Reply not found"));

        if (!reply.getDiscussion().getUser().getId().equals(userId)) {
            throw ApiException.forbidden("Only the discussion author can mark an answer");
        }

        reply.setIsAnswer(true);
        reply.getDiscussion().setIsAnswered(true);
        discussionRepository.save(reply.getDiscussion());

        return toReplyDto(replyRepository.save(reply), userId);
    }

    private DiscussionDto toDto(Discussion d, Long viewerUserId) {
        String avatar = userProfileRepository.findByUserId(d.getUser().getId())
            .map(UserProfile::getAvatarUrl).orElse(null);
        Integer myVote = viewerUserId == null ? null :
            voteRepository.findByUserIdAndDiscussionId(viewerUserId, d.getId())
                .map(v -> (int) v.getValue()).orElse(null);
        String problemTitle = d.getProblem() != null ? d.getProblem().getTitle() : null;
        String problemSlug = d.getProblem() != null ? d.getProblem().getSlug() : null;
        Long problemId = d.getProblem() != null ? d.getProblem().getId() : null;
        return new DiscussionDto(
            d.getId(), problemId, problemTitle, problemSlug,
            d.getUser().getUsername(), avatar,
            d.getTitle(), d.getContentMarkdown(), d.getCategory(),
            d.getVoteScore(), d.getReplyCount(), d.getIsAnswered(),
            myVote, d.getCreatedAt(), d.getUpdatedAt()
        );
    }

    private DiscussionReplyDto toReplyDto(DiscussionReply r, Long viewerUserId) {
        String avatar = userProfileRepository.findByUserId(r.getUser().getId())
            .map(UserProfile::getAvatarUrl).orElse(null);
        Integer myVote = viewerUserId == null ? null :
            voteRepository.findByUserIdAndReplyId(viewerUserId, r.getId())
                .map(v -> (int) v.getValue()).orElse(null);
        List<DiscussionReplyDto> children = replyRepository
            .findByParentIdOrderByCreatedAtAsc(r.getId())
            .stream().map(c -> toReplyDto(c, viewerUserId)).toList();
        return new DiscussionReplyDto(
            r.getId(), r.getUser().getUsername(), avatar,
            r.getContentMarkdown(), r.getVoteScore(), r.getIsAnswer(),
            myVote, r.getCreatedAt(), children
        );
    }
}
