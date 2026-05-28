package dev.codecrafter.solution;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.problem.repository.ProblemRepository;
import dev.codecrafter.solution.dto.*;
import dev.codecrafter.solution.entity.Solution;
import dev.codecrafter.solution.entity.SolutionComment;
import dev.codecrafter.solution.entity.SolutionVote;
import dev.codecrafter.solution.repository.SolutionCommentRepository;
import dev.codecrafter.solution.repository.SolutionRepository;
import dev.codecrafter.solution.repository.SolutionVoteRepository;
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
public class SolutionService {

    private final SolutionRepository solutionRepository;
    private final SolutionVoteRepository solutionVoteRepository;
    private final SolutionCommentRepository solutionCommentRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional(readOnly = true)
    public Page<SolutionDto> listSolutions(String slug, Pageable pageable, Long viewerUserId) {
        Problem problem = problemRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Problem not found"));
        return solutionRepository.findByProblemId(problem.getId(), pageable)
            .map(s -> toDto(s, viewerUserId));
    }

    @Transactional
    public SolutionDto createSolution(String slug, CreateSolutionRequest req, Long userId) {
        Problem problem = problemRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Problem not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        Solution solution = Solution.builder()
            .problem(problem)
            .user(user)
            .title(req.title())
            .contentMarkdown(req.contentMarkdown())
            .language(req.language())
            .build();

        return toDto(solutionRepository.save(solution), userId);
    }

    @Transactional
    public SolutionDto vote(Long solutionId, short value, Long userId) {
        Solution solution = solutionRepository.findById(solutionId)
            .orElseThrow(() -> ApiException.notFound("Solution not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        solutionVoteRepository.findBySolutionIdAndUserId(solutionId, userId).ifPresentOrElse(
            existing -> {
                if (existing.getValue() == value) {
                    // toggling off same vote
                    solutionVoteRepository.delete(existing);
                    solution.setVoteScore(solution.getVoteScore() - value);
                } else {
                    int delta = value - existing.getValue();
                    existing.setValue(value);
                    solutionVoteRepository.save(existing);
                    solution.setVoteScore(solution.getVoteScore() + delta);
                }
            },
            () -> {
                SolutionVote vote = SolutionVote.builder()
                    .solution(solution).user(user).value(value).build();
                solutionVoteRepository.save(vote);
                solution.setVoteScore(solution.getVoteScore() + value);
            }
        );

        return toDto(solutionRepository.save(solution), userId);
    }

    @Transactional(readOnly = true)
    public List<SolutionCommentDto> listComments(Long solutionId, Long viewerUserId) {
        solutionRepository.findById(solutionId)
            .orElseThrow(() -> ApiException.notFound("Solution not found"));
        return solutionCommentRepository
            .findBySolutionIdAndParentIsNullOrderByCreatedAtAsc(solutionId)
            .stream()
            .map(c -> toCommentDto(c, viewerUserId))
            .toList();
    }

    @Transactional
    public SolutionCommentDto addComment(Long solutionId, AddCommentRequest req, Long userId) {
        Solution solution = solutionRepository.findById(solutionId)
            .orElseThrow(() -> ApiException.notFound("Solution not found"));
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        SolutionComment parent = null;
        if (req.parentId() != null) {
            parent = solutionCommentRepository.findById(req.parentId())
                .orElseThrow(() -> ApiException.notFound("Parent comment not found"));
        }

        SolutionComment comment = SolutionComment.builder()
            .solution(solution).user(user).parent(parent)
            .contentMarkdown(req.contentMarkdown())
            .build();

        solution.setCommentCount(solution.getCommentCount() + 1);
        solutionRepository.save(solution);

        return toCommentDto(solutionCommentRepository.save(comment), userId);
    }

    private SolutionDto toDto(Solution s, Long viewerUserId) {
        String avatar = userProfileRepository.findByUserId(s.getUser().getId())
            .map(UserProfile::getAvatarUrl).orElse(null);
        Integer myVote = viewerUserId == null ? null :
            solutionVoteRepository.findBySolutionIdAndUserId(s.getId(), viewerUserId)
                .map(v -> (int) v.getValue()).orElse(null);
        return new SolutionDto(
            s.getId(), s.getProblem().getId(),
            s.getUser().getUsername(), avatar,
            s.getTitle(), s.getContentMarkdown(), s.getLanguage(),
            s.getVoteScore(), s.getCommentCount(), myVote,
            s.getCreatedAt(), s.getUpdatedAt()
        );
    }

    private SolutionCommentDto toCommentDto(SolutionComment c, Long viewerUserId) {
        String avatar = userProfileRepository.findByUserId(c.getUser().getId())
            .map(UserProfile::getAvatarUrl).orElse(null);
        List<SolutionCommentDto> replies = solutionCommentRepository
            .findByParentIdOrderByCreatedAtAsc(c.getId())
            .stream().map(r -> toCommentDto(r, viewerUserId)).toList();
        return new SolutionCommentDto(
            c.getId(), c.getUser().getUsername(), avatar,
            c.getContentMarkdown(), c.getVoteScore(), null,
            c.getCreatedAt(), replies
        );
    }
}
