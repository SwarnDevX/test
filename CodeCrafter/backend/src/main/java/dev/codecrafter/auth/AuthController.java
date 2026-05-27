package dev.codecrafter.auth;

import dev.codecrafter.auth.dto.*;
import dev.codecrafter.security.AppUserDetails;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication and token management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a new user account")
    public Map<String, String> register(@Valid @RequestBody RegisterRequest req) {
        authService.register(req);
        return Map.of("message", "Registration successful. Please verify your email.");
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public AuthResponse login(@Valid @RequestBody LoginRequest req, HttpServletRequest request) {
        String clientIp = getClientIp(request);
        return authService.login(req, clientIp);
    }

    @PostMapping("/refresh")
    @Operation(summary = "Rotate access + refresh token pair")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest req) {
        return authService.refresh(req.refreshToken());
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke tokens and blacklist access token")
    public ResponseEntity<Void> logout(
        @AuthenticationPrincipal AppUserDetails principal,
        HttpServletRequest request
    ) {
        String header = request.getHeader("Authorization");
        String token = (header != null && header.startsWith("Bearer ")) ? header.substring(7) : "";
        authService.logout(token, principal.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Verify email address with token from email link")
    public Map<String, String> verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        authService.verifyEmail(req.token());
        return Map.of("message", "Email verified successfully. You can now log in.");
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend email verification link")
    public Map<String, String> resendVerification(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.resendVerification(req.email());
        return Map.of("message", "Verification email sent if account exists.");
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset email")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        authService.forgotPassword(req.email());
        return Map.of("message", "If an account exists for that email, a reset link has been sent.");
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using token from email link")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return Map.of("message", "Password reset successfully. You can now log in.");
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
