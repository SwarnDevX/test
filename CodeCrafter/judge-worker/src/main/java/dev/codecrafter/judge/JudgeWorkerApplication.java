package dev.codecrafter.judge;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Phase 0 stub — consumes RabbitMQ submission jobs and runs code in sandboxed Docker containers.
 * Full implementation in Phase 3.
 */
@SpringBootApplication
public class JudgeWorkerApplication {

    public static void main(String[] args) {
        SpringApplication.run(JudgeWorkerApplication.class, args);
    }
}
