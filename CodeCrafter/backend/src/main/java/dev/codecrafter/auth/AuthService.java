package dev.codecrafter.auth;

import dev.codecrafter.auth.dto.*;
import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.infra.mail.MailService;
import dev.codecrafter.infra.redis.RateLimiterService;
import dev.codecrafter.security.JwtAuthFilter;
import dev.codecrafter.security.JwtUtil;
import dev.codecrafter.user.entity.*;
import dev.codecrafter.user.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserProfileRepository profileRepository;
    private final UserStatsRepository statsRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final MailService mailService;
    private final RateLimiterService rateLimiter;
    private final StringRedisTemplate redisTemplate;

    @Transactional
    public void register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email().toLowerCase())) {
            throw ApiException.conflict("Email already registered");
        }
        if (userRepository.existsByUsername(req.username().toLowerCase())) {
            throw ApiException.conflict("Username already taken");
        }

        Role userRole = roleRepository.findByName("ROLE_USER")
            .orElseThrow(() -> new IllegalStateException("ROLE_USER not seeded"));

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
            .email(req.email().toLowerCase())
            .username(req.username().toLowerCase())
            .passwordHash(passwordEncoder.encode(req.password()))
            .emailVerified(false)
            .emailVerificationToken(verificationToken)
            .emailVerificationExpiresAt(Instant.now().plus(Duration.ofHours(24)))
            .active(true)
            .roles(Set.of(userRole))
            .build();
        user = userRepository.save(user);

        profileRepository.save(UserProfile.builder().user(user).build());
        statsRepository.save(UserStats.builder().user(user).build());

        mailService.sendVerificationEmail(user.getEmail(), verificationToken);
        log.info("Registered user: {}", user.getEmail());
    }

    @Transactional
    public AuthResponse login(LoginRequest req, String clientIp) {
        if (!rateLimiter.isIpAllowed(clientIp, "login", 10, Duration.ofMinutes(1))) {
            throw ApiException.tooManyRequests("Too many login attempts. Try again in a minute.");
        }

        User user = userRepository.findByEmailWithRoles(req.email().toLowerCase())
            .orElseThrow(() -> ApiException.unauthorized("Invalid credentials"));

        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid credentials");
        }
        if (!user.isEmailVerified()) {
            throw ApiException.forbidden("Email not verified. Check your inbox.");
        }
        if (!user.isActive()) {
            throw ApiException.forbidden("Account is disabled.");
        }

        return buildTokenPair(user);
    }

    @Transactional
    public AuthResponse refresh(String rawRefreshToken) {
        String hash = sha256(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
            .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));

        if (stored.isRevoked()) {
            // Reuse detected — revoke ALL tokens for this user
            refreshTokenRepository.revokeAllByUserId(stored.getUser().getId());
            log.warn("Refresh token reuse detected for user {}", stored.getUser().getId());
            throw ApiException.unauthorized("Refresh token reuse detected. Please log in again.");
        }
        if (stored.isExpired()) {
            throw ApiException.unauthorized("Refresh token expired");
        }

        User user = userRepository.findByIdWithRoles(stored.getUser().getId())
            .orElseThrow(() -> ApiException.unauthorized("User not found"));

        // Rotate: revoke old, issue new
        String newRawToken = UUID.randomUUID().toString();
        String newHash = sha256(newRawToken);
        stored.setRevoked(true);
        stored.setReplacedByHash(newHash);
        refreshTokenRepository.save(stored);

        RefreshToken newToken = RefreshToken.builder()
            .user(user)
            .tokenHash(newHash)
            .expiresAt(Instant.now().plus(Duration.ofDays(7)))
            .build();
        refreshTokenRepository.save(newToken);

        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), roles);

        return new AuthResponse(accessToken, newRawToken, user.getId(), user.getEmail(),
            user.getUsername(), List.copyOf(roles));
    }

    @Transactional
    public void logout(String accessToken, Long userId) {
        // Blacklist the access token in Redis
        String jti = jwtUtil.extractJti(accessToken);
        long ttl = jwtUtil.getRemainingTtlSeconds(accessToken);
        if (ttl > 0) {
            redisTemplate.opsForValue().set(
                JwtAuthFilter.BLACKLIST_PREFIX + jti,
                "1",
                ttl,
                TimeUnit.SECONDS
            );
        }
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    @Transactional
    public void verifyEmail(String token) {
        User user = userRepository.findByEmailVerificationToken(token)
            .orElseThrow(() -> ApiException.badRequest("Invalid or expired verification token"));

        if (user.isEmailVerified()) {
            return; // already verified — idempotent
        }
        if (user.getEmailVerificationExpiresAt() != null
            && Instant.now().isAfter(user.getEmailVerificationExpiresAt())) {
            throw ApiException.badRequest("Verification token has expired. Request a new one.");
        }

        user.setEmailVerified(true);
        user.setEmailVerificationToken(null);
        user.setEmailVerificationExpiresAt(null);
        userRepository.save(user);
    }

    @Transactional
    public void resendVerification(String email) {
        User user = userRepository.findByEmail(email.toLowerCase())
            .orElseThrow(() -> ApiException.notFound("User not found"));
        if (user.isEmailVerified()) {
            throw ApiException.badRequest("Email already verified");
        }
        String newToken = UUID.randomUUID().toString();
        user.setEmailVerificationToken(newToken);
        user.setEmailVerificationExpiresAt(Instant.now().plus(Duration.ofHours(24)));
        userRepository.save(user);
        mailService.sendVerificationEmail(user.getEmail(), newToken);
    }

    @Transactional
    public void forgotPassword(String email) {
        // Return 200 even if email not found (prevents enumeration)
        userRepository.findByEmail(email.toLowerCase()).ifPresent(user -> {
            passwordResetTokenRepository.invalidateAllForUser(user.getId());
            String rawToken = UUID.randomUUID().toString();
            PasswordResetToken prt = PasswordResetToken.builder()
                .user(user)
                .tokenHash(sha256(rawToken))
                .expiresAt(Instant.now().plus(Duration.ofHours(1)))
                .build();
            passwordResetTokenRepository.save(prt);
            mailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        PasswordResetToken prt = passwordResetTokenRepository.findByTokenHashAndUsedFalse(sha256(req.token()))
            .orElseThrow(() -> ApiException.badRequest("Invalid or expired reset token"));
        if (prt.isExpired()) {
            throw ApiException.badRequest("Reset token has expired. Request a new one.");
        }
        User user = prt.getUser();
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        prt.setUsed(true);
        passwordResetTokenRepository.save(prt);
        refreshTokenRepository.revokeAllByUserId(user.getId());
    }

    public AuthResponse buildTokenPair(User user) {
        Set<String> roles = user.getRoles().stream().map(Role::getName).collect(Collectors.toSet());
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getEmail(), roles);
        String rawRefreshToken = UUID.randomUUID().toString();
        RefreshToken refreshToken = RefreshToken.builder()
            .user(user)
            .tokenHash(sha256(rawRefreshToken))
            .expiresAt(Instant.now().plus(Duration.ofDays(7)))
            .build();
        refreshTokenRepository.save(refreshToken);
        return new AuthResponse(accessToken, rawRefreshToken, user.getId(), user.getEmail(),
            user.getUsername(), List.copyOf(roles));
    }

    static String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(
                digest.digest(input.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
