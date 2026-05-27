package dev.codecrafter.auth;

import dev.codecrafter.auth.dto.AuthResponse;
import dev.codecrafter.auth.dto.LoginRequest;
import dev.codecrafter.auth.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class AuthControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("codecrafter_test")
        .withUsername("cc_test")
        .withPassword("cc_test");

    @Container
    @SuppressWarnings("resource")
    static GenericContainer<?> redis = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
        .withExposedPorts(6379);

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
        registry.add("spring.data.redis.password", () -> "");
    }

    @LocalServerPort
    int port;

    @Autowired
    TestRestTemplate restTemplate;

    private String baseUrl() {
        return "http://localhost:" + port + "/api/v1";
    }

    @Test
    void register_and_login_flow() {
        // Register
        var regReq = new RegisterRequest("it@test.com", "ituser", "P@ssword123!");
        ResponseEntity<String> regResp = restTemplate.postForEntity(
            baseUrl() + "/auth/register", regReq, String.class);
        assertThat(regResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // Cannot log in before email verification
        var loginReq = new LoginRequest("it@test.com", "P@ssword123!");
        ResponseEntity<String> loginResp = restTemplate.postForEntity(
            baseUrl() + "/auth/login", loginReq, String.class);
        assertThat(loginResp.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void login_withInvalidCredentials_returns401() {
        var loginReq = new LoginRequest("nobody@test.com", "wrong");
        ResponseEntity<String> resp = restTemplate.postForEntity(
            baseUrl() + "/auth/login", loginReq, String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void refresh_withInvalidToken_returns401() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        var body = new org.springframework.http.HttpEntity<>(
            "{\"refreshToken\":\"not-a-real-token\"}", headers);
        ResponseEntity<String> resp = restTemplate.postForEntity(
            baseUrl() + "/auth/refresh", body, String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void forgotPassword_doesNotRevealUserExistence() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        var body = new org.springframework.http.HttpEntity<>(
            "{\"email\":\"nonexistent@test.com\"}", headers);
        ResponseEntity<String> resp = restTemplate.postForEntity(
            baseUrl() + "/auth/forgot-password", body, String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    void healthEndpoint_isPublic() {
        ResponseEntity<String> resp = restTemplate.getForEntity(
            baseUrl() + "/health", String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
}
