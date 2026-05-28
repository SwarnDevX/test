package dev.codecrafter.judge.listener;

import com.rabbitmq.client.Channel;
import dev.codecrafter.judge.messaging.JudgeJobMessage;
import dev.codecrafter.judge.messaging.VerdictMessage;
import dev.codecrafter.judge.service.JudgeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JudgeListener {

    private final JudgeService judgeService;
    private final RabbitTemplate rabbitTemplate;

    @Value("${judge.verdict-queue:verdicts.queue}")
    private String verdictQueue;

    @RabbitListener(queues = "${judge.submission-queue:submissions.queue}")
    public void onJob(JudgeJobMessage job,
                      Channel channel,
                      @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) {
        log.info("Received job for submission {}", job.submissionId());
        try {
            VerdictMessage verdict = judgeService.judge(job);
            rabbitTemplate.convertAndSend(verdictQueue, verdict);
            log.info("Published verdict {} for submission {}", verdict.verdict(), job.submissionId());
        } catch (Exception e) {
            log.error("Fatal error processing submission {}", job.submissionId(), e);
        } finally {
            // Always ack — JudgeService persists the verdict (even INTERNAL_ERROR) before returning,
            // so requeuing would cause duplicate execution of the same submission.
            try {
                channel.basicAck(deliveryTag, false);
            } catch (IOException e) {
                log.warn("Failed to ack delivery {} for submission {}", deliveryTag, job.submissionId(), e);
            }
        }
    }
}
