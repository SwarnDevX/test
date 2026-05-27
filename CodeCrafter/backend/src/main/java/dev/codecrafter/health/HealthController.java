package dev.codecrafter.health;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;

@RestController
@RequestMapping("/api/v1")
@Tag(name = "Health", description = "Service health check")
public class HealthController {

    record HealthResponse(String status, String version, String timestamp) {}

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Returns service status and version")
    public ResponseEntity<HealthResponse> health() {
        return ResponseEntity.ok(new HealthResponse("UP", "0.1.0", Instant.now().toString()));
    }
}
