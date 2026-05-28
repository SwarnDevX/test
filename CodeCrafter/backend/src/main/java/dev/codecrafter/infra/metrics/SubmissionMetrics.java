package dev.codecrafter.infra.metrics;

import io.micrometer.core.instrument.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * Custom Micrometer metrics scraped by Prometheus at /actuator/prometheus.
 *
 * Counters (ever-increasing):
 *   codecrafter_submissions_queued_total{language}
 *   codecrafter_submissions_verdict_total{verdict, language}
 *
 * Gauges (point-in-time):
 *   codecrafter_submissions_inflight  — QUEUED + RUNNING submissions
 *
 * Timers (histogram + summary):
 *   codecrafter_submission_queue_wait_seconds — time from queued to verdict received
 */
@Component
@RequiredArgsConstructor
public class SubmissionMetrics {

    private final MeterRegistry registry;

    private final AtomicInteger inflightSubmissions = new AtomicInteger(0);

    @PostConstruct
    void init() {
        Gauge.builder("codecrafter.submissions.inflight", inflightSubmissions, AtomicInteger::get)
            .description("Number of submissions currently QUEUED or RUNNING")
            .register(registry);
    }

    public void recordQueued(String language) {
        inflightSubmissions.incrementAndGet();
        Counter.builder("codecrafter.submissions.queued")
            .tag("language", normalize(language))
            .description("Total submissions queued")
            .register(registry)
            .increment();
    }

    public void recordVerdict(String verdict, String language, long queuedToVerdictMs) {
        inflightSubmissions.decrementAndGet();

        Counter.builder("codecrafter.submissions.verdict")
            .tag("verdict", verdict)
            .tag("language", normalize(language))
            .description("Total verdicts by outcome and language")
            .register(registry)
            .increment();

        Timer.builder("codecrafter.submission.queue.wait")
            .tag("verdict", verdict)
            .description("Time from submission queued to verdict received (ms)")
            .publishPercentileHistogram()
            .serviceLevelObjectives(
                java.time.Duration.ofMillis(500),
                java.time.Duration.ofMillis(1000),
                java.time.Duration.ofMillis(2000),
                java.time.Duration.ofMillis(5000)
            )
            .register(registry)
            .record(java.time.Duration.ofMillis(queuedToVerdictMs));
    }

    public void recordRunError() {
        Counter.builder("codecrafter.submissions.run_errors")
            .description("Submissions that resulted in INTERNAL_ERROR")
            .register(registry)
            .increment();
    }

    private static String normalize(String lang) {
        if (lang == null) return "unknown";
        return lang.toLowerCase().replace("+", "plus");
    }
}
