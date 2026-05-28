package dev.codecrafter.auth.oauth2;

import dev.codecrafter.auth.AuthService;
import dev.codecrafter.auth.dto.AuthResponse;
import dev.codecrafter.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final AuthService authService;
    private final UserRepository userRepository;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        String email = authentication.getName();
        userRepository.findByEmailWithRoles(email).ifPresentOrElse(user -> {
            AuthResponse tokens = authService.buildTokenPair(user);
            String roles = String.join(",", tokens.roles());
            String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendUrl + "/auth/callback")
                .queryParam("accessToken", tokens.accessToken())
                .queryParam("refreshToken", tokens.refreshToken())
                .queryParam("userId", tokens.userId())
                .queryParam("email", tokens.email())
                .queryParam("username", tokens.username())
                .queryParam("roles", roles)
                .build().toUriString();
            try {
                getRedirectStrategy().sendRedirect(request, response, redirectUrl);
            } catch (IOException e) {
                log.error("OAuth2 redirect failed", e);
            }
        }, () -> {
            try {
                response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "User not found after OAuth2");
            } catch (IOException e) {
                log.error("OAuth2 error response failed", e);
            }
        });
    }
}
