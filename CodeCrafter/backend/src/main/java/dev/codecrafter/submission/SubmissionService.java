package dev.codecrafter.submission;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.infra.metrics.SubmissionMetrics;
import dev.codecrafter.problem.entity.Problem;
import dev.codecrafter.problem.repository.ProblemRepository;
import dev.codecrafter.submission.dto.SubmissionDetailDto;
import dev.codecrafter.submission.dto.SubmissionDto;
import dev.codecrafter.submission.dto.SubmitRequest;
import dev.codecrafter.submission.entity.Submission;
import dev.codecrafter.submission.entity.SubmissionStatus;
import dev.codecrafter.submission.messaging.JudgeJobMessage;
import dev.codecrafter.submission.repository.SubmissionRepository;
import dev.codecrafter.user.entity.User;
import dev.codecrafter.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionService {

    private final SubmissionRepository submissionRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;
    private final SubmissionMetrics submissionMetrics;

    @Value("${app.rabbitmq.submission-exchange}")
    private String submissionExchange;

    @Value("${app.rabbitmq.submission-routing-key}")
    private String submissionRoutingKey;

    @Transactional
    public SubmissionDto submit(String slug, SubmitRequest req, Long userId) {
        Problem problem = problemRepository.findBySlugAndActiveTrue(slug)
            .orElseThrow(() -> ApiException.notFound("Problem not found"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));

        Submission submission = Submission.builder()
            .user(user)
            .problem(problem)
            .language(req.language())
            .sourceCode(req.sourceCode())
            .status(SubmissionStatus.QUEUED)
            .build();

        submission = submissionRepository.save(submission);

        JudgeJobMessage job = new JudgeJobMessage(
            submission.getId(),
            userId,
            problem.getId(),
            req.language(),
            req.sourceCode(),
            problem.getTimeLimitMs(),
            problem.getMemoryLimitMb()
        );

        rabbitTemplate.convertAndSend(submissionExchange, submissionRoutingKey, job);
        submissionMetrics.recordQueued(req.language());
        log.info("Queued submission {} for problem {} by user {}", submission.getId(), slug, userId);

        return SubmissionDto.from(submission);
    }

    @Transactional(readOnly = true)
    public Page<SubmissionDto> listForUser(Long userId, int page, int size) {
        return submissionRepository.findByUserId(userId,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
            .map(SubmissionDto::from);
    }

    @Transactional(readOnly = true)
    public Page<SubmissionDto> listForProblem(String slug, Long userId, int page, int size) {
        return submissionRepository.findByProblemSlugAndUserId(slug, userId,
            PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")))
            .map(SubmissionDto::from);
    }

    @Transactional(readOnly = true)
    public SubmissionDetailDto getById(Long id, Long userId) {
        Submission s = submissionRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Submission not found"));
        if (!s.getUser().getId().equals(userId)) {
            throw ApiException.forbidden("Forbidden");
        }
        return SubmissionDetailDto.from(s);
    }
}
