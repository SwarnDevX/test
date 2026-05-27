package dev.codecrafter.auth;

import dev.codecrafter.auth.dto.LoginRequest;
import dev.codecrafter.auth.dto.RegisterRequest;
import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.infra.mail.MailService;
import dev.codecrafter.infra.redis.RateLimiterService;
import dev.codecrafter.security.JwtUtil;
import dev.codecrafter.user.entity.*;
import dev.codecrafter.user.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock RoleRepository roleRepository;
    @Mock UserProfileRepository profileRepository;
    @Mock UserStatsRepository statsRepository;
    @Mock RefreshTokenRepository refreshTokenRepository;
    @Mock PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtUtil jwtUtil;
    @Mock MailService mailService;
    @Mock RateLimiterService rateLimiter;
    @Mock StringRedisTemplate redisTemplate;

    @InjectMocks
    AuthService authService;

    private Role userRole;
    private User activeUser;

    @BeforeEach
    void setUp() {
        userRole = Role.builder().id(1L).name("ROLE_USER").build();
        activeUser = User.builder()
            .id(1L)
            .email("user@test.com")
            .username("testuser")
            .passwordHash("$hash$")
            .emailVerified(true)
            .active(true)
            .roles(Set.of(userRole))
            .build();
    }

    // ── register ──────────────────────────────────────────────────────────────

    @Test
    void register_success() {
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(roleRepository.findByName("ROLE_USER")).thenReturn(Optional.of(userRole));
        when(passwordEncoder.encode(any())).thenReturn("$hashed$");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u = User.builder().id(99L).email(u.getEmail()).username(u.getUsername())
                .passwordHash(u.getPasswordHash()).emailVerified(false).active(true)
                .roles(u.getRoles()).build();
            return u;
        });

        authService.register(new RegisterRequest("new@test.com", "newuser", "P@ssword1"));

        verify(mailService).sendVerificationEmail(eq("new@test.com"), anyString());
        verify(profileRepository).save(any());
        verify(statsRepository).save(any());
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(true);
        assertThatThrownBy(() ->
            authService.register(new RegisterRequest("user@test.com", "other", "P@ssword1")))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Email already registered");
    }

    @Test
    void register_duplicateUsername_throwsConflict() {
        when(userRepository.existsByEmail("new@test.com")).thenReturn(false);
        when(userRepository.existsByUsername("testuser")).thenReturn(true);
        assertThatThrownBy(() ->
            authService.register(new RegisterRequest("new@test.com", "testuser", "P@ssword1")))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Username already taken");
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    void login_success() {
        when(rateLimiter.isIpAllowed(any(), any(), anyInt(), any())).thenReturn(true);
        when(userRepository.findByEmailWithRoles("user@test.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("correct", "$hash$")).thenReturn(true);
        when(jwtUtil.generateAccessToken(any(), any(), any())).thenReturn("access-token");
        when(refreshTokenRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var response = authService.login(new LoginRequest("user@test.com", "correct"), "127.0.0.1");

        assertThat(response.accessToken()).isEqualTo("access-token");
        assertThat(response.userId()).isEqualTo(1L);
    }

    @Test
    void login_wrongPassword_throwsUnauthorized() {
        when(rateLimiter.isIpAllowed(any(), any(), anyInt(), any())).thenReturn(true);
        when(userRepository.findByEmailWithRoles("user@test.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrong", "$hash$")).thenReturn(false);

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("user@test.com", "wrong"), "127.0.0.1"))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Invalid credentials");
    }

    @Test
    void login_unverifiedEmail_throwsForbidden() {
        activeUser.setEmailVerified(false);
        when(rateLimiter.isIpAllowed(any(), any(), anyInt(), any())).thenReturn(true);
        when(userRepository.findByEmailWithRoles("user@test.com")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("correct", "$hash$")).thenReturn(true);

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("user@test.com", "correct"), "127.0.0.1"))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Email not verified");
    }

    @Test
    void login_rateLimited_throwsTooManyRequests() {
        when(rateLimiter.isIpAllowed(any(), any(), anyInt(), any())).thenReturn(false);

        assertThatThrownBy(() ->
            authService.login(new LoginRequest("user@test.com", "correct"), "127.0.0.1"))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("Too many login attempts");
    }

    // ── verifyEmail ───────────────────────────────────────────────────────────

    @Test
    void verifyEmail_success() {
        User unverified = User.builder()
            .id(2L).email("v@test.com").emailVerified(false)
            .emailVerificationToken("tok123")
            .emailVerificationExpiresAt(Instant.now().plus(Duration.ofHours(1)))
            .roles(Set.of(userRole))
            .build();
        when(userRepository.findByEmailVerificationToken("tok123")).thenReturn(Optional.of(unverified));

        authService.verifyEmail("tok123");

        assertThat(unverified.isEmailVerified()).isTrue();
        assertThat(unverified.getEmailVerificationToken()).isNull();
        verify(userRepository).save(unverified);
    }

    @Test
    void verifyEmail_expired_throwsBadRequest() {
        User unverified = User.builder()
            .id(2L).email("v@test.com").emailVerified(false)
            .emailVerificationToken("tok123")
            .emailVerificationExpiresAt(Instant.now().minus(Duration.ofHours(1)))
            .roles(Set.of(userRole))
            .build();
        when(userRepository.findByEmailVerificationToken("tok123")).thenReturn(Optional.of(unverified));

        assertThatThrownBy(() -> authService.verifyEmail("tok123"))
            .isInstanceOf(ApiException.class)
            .hasMessageContaining("expired");
    }
}
