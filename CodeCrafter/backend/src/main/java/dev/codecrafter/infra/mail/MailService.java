package dev.codecrafter.infra.mail;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class MailService {

    private final JavaMailSender mailSender;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Async
    public void sendVerificationEmail(String to, String token) {
        String link = frontendUrl + "/auth/verify-email?token=" + token;
        send(
            to,
            "Verify your CodeCrafter account",
            "Welcome to CodeCrafter!\n\nVerify your email address by clicking the link below:\n\n"
                + link
                + "\n\nThis link expires in 24 hours.\n\nIf you did not sign up, please ignore this email."
        );
    }

    @Async
    public void sendPasswordResetEmail(String to, String token) {
        String link = frontendUrl + "/auth/reset-password?token=" + token;
        send(
            to,
            "Reset your CodeCrafter password",
            "You requested a password reset for your CodeCrafter account.\n\nClick the link below to reset your password:\n\n"
                + link
                + "\n\nThis link expires in 1 hour.\n\nIf you did not request this, please ignore this email."
        );
    }

    private void send(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            msg.setFrom("noreply@codecrafter.dev");
            mailSender.send(msg);
        } catch (MailException e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
