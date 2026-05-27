package dev.codecrafter.submission.messaging;

import dev.codecrafter.stats.StatsSyncService;
import dev.codecrafter.submission.entity.Submission;
import dev.codecrafter.submission.entity.SubmissionStatus;
import dev.codecrafter.submission.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class VerdictListener {

    private final SubmissionRepository submissionRepository;
    private final SimpMessagingTemplate ws;
    private final StatsSyncService statsSyncService;

    @RabbitListener(queues = "${app.rabbitmq.verdict-queue}")
    @Transactional
    public void onVerdict(VerdictMessage msg) {
        log.info("Received verdict {} for submission {}", msg.verdict(), msg.submissionId());

        submissionRepository.findById(msg.submissionId()).ifPresent(sub -> {
            SubmissionStatus status = parseStatus(msg.verdict());
            sub.setStatus(status);
            sub.setVerdict(status);
            sub.setTestcasesPassed(msg.testcasesPassed());
            sub.setTotalTestcases(msg.totalTestcases());
            sub.setFailingTestcaseIndex(msg.failingTestcaseIndex());
            sub.setRuntimeMs(msg.runtimeMs());
            sub.setMemoryKb(msg.memoryKb());
            sub.setCompileError(msg.compileError());

            if (!msg.results().isEmpty()) {
                TestCaseResultMessage first = msg.results().get(0);
                sub.setStdout(first.actualOutput());
                sub.setStderr(first.stderr());
            }

            submissionRepository.save(sub);

            if (status == SubmissionStatus.ACCEPTED) {
                statsSyncService.onAccepted(sub.getUser().getId(), sub.getProblem().getId());
            }
        });

        ws.convertAndSend("/topic/submissions/" + msg.submissionId(), msg);
        ws.convertAndSendToUser(msg.userId().toString(), "/queue/verdicts", msg);
    }

    private SubmissionStatus parseStatus(String verdict) {
        try {
            return SubmissionStatus.valueOf(verdict);
        } catch (IllegalArgumentException e) {
            return SubmissionStatus.INTERNAL_ERROR;
        }
    }
}
