package dev.codecrafter.auth.oauth2;

import dev.codecrafter.user.entity.*;
import dev.codecrafter.user.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserProfileRepository profileRepository;
    private final UserStatsRepository statsRepository;
    private final OAuthAccountRepository oauthAccountRepository;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest request) throws OAuth2AuthenticationException {
        OAuth2User oauthUser = super.loadUser(request);

        String provider = request.getClientRegistration().getRegistrationId();
        String providerAccountId = oauthUser.getName();
        String email = extractEmail(provider, oauthUser);
        String displayName = extractDisplayName(provider, oauthUser);
        String avatarUrl = extractAvatarUrl(provider, oauthUser);

        if (email == null) {
            log.warn("OAuth2 provider {} did not return email for account {}", provider, providerAccountId);
            throw new OAuth2AuthenticationException("Email not provided by OAuth2 provider");
        }

        // Find existing user or create new one
        User user = userRepository.findByEmail(email.toLowerCase()).orElseGet(() -> {
            Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalStateException("ROLE_USER not seeded"));

            User newUser = User.builder()
                .email(email.toLowerCase())
                .emailVerified(true)
                .active(true)
                .roles(Set.of(userRole))
                .build();
            newUser = userRepository.save(newUser);

            profileRepository.save(UserProfile.builder()
                .user(newUser)
                .displayName(displayName)
                .avatarUrl(avatarUrl)
                .build());
            statsRepository.save(UserStats.builder().user(newUser).build());

            log.info("Created new user via OAuth2 {}: {}", provider, email);
            return newUser;
        });

        // Link OAuth2 account if not already linked
        oauthAccountRepository.findByProviderAndProviderAccountId(provider, providerAccountId)
            .orElseGet(() -> oauthAccountRepository.save(
                OAuthAccount.builder()
                    .user(user)
                    .provider(provider)
                    .providerAccountId(providerAccountId)
                    .build()
            ));

        return oauthUser;
    }

    private String extractEmail(String provider, OAuth2User user) {
        return switch (provider) {
            case "google" -> user.getAttribute("email");
            case "github" -> {
                String email = user.getAttribute("email");
                if (email != null) yield email;
                // GitHub may not expose email if user set it private
                String login = user.getAttribute("login");
                yield login != null ? login + "@users.noreply.github.com" : null;
            }
            default -> null;
        };
    }

    private String extractDisplayName(String provider, OAuth2User user) {
        return switch (provider) {
            case "google" -> user.getAttribute("name");
            case "github" -> {
                String name = user.getAttribute("name");
                yield name != null ? name : user.getAttribute("login");
            }
            default -> null;
        };
    }

    private String extractAvatarUrl(String provider, OAuth2User user) {
        return switch (provider) {
            case "google" -> user.getAttribute("picture");
            case "github" -> user.getAttribute("avatar_url");
            default -> null;
        };
    }
}
