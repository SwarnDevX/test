package dev.codecrafter.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        // 32-char secret satisfying the 256-bit minimum
        ReflectionTestUtils.setField(jwtUtil, "jwtSecret", "test-secret-key-must-be-32-chars!!");
        ReflectionTestUtils.setField(jwtUtil, "accessExpiryMinutes", 15);
        jwtUtil.init();
    }

    @Test
    void generatesValidToken() {
        String token = jwtUtil.generateAccessToken(1L, "user@test.com", Set.of("ROLE_USER"));
        assertThat(jwtUtil.isTokenValid(token)).isTrue();
    }

    @Test
    void extractsCorrectClaims() {
        String token = jwtUtil.generateAccessToken(42L, "alice@test.com", Set.of("ROLE_USER", "ROLE_ADMIN"));

        assertThat(jwtUtil.extractUserId(token)).isEqualTo(42L);
        assertThat(jwtUtil.extractEmail(token)).isEqualTo("alice@test.com");
        assertThat(jwtUtil.extractJti(token)).isNotBlank();
        assertThat(jwtUtil.isAccessToken(token)).isTrue();
    }

    @Test
    void remainingTtlIsPositive() {
        String token = jwtUtil.generateAccessToken(1L, "user@test.com", Set.of("ROLE_USER"));
        assertThat(jwtUtil.getRemainingTtlSeconds(token)).isPositive();
    }

    @Test
    void invalidTokenRejected() {
        assertThat(jwtUtil.isTokenValid("not.a.jwt")).isFalse();
    }

    @Test
    void jtiIsUniquePerToken() {
        String t1 = jwtUtil.generateAccessToken(1L, "user@test.com", Set.of());
        String t2 = jwtUtil.generateAccessToken(1L, "user@test.com", Set.of());
        assertThat(jwtUtil.extractJti(t1)).isNotEqualTo(jwtUtil.extractJti(t2));
    }
}
