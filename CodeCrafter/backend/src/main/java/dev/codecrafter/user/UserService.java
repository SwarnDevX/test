package dev.codecrafter.user;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.infra.minio.MinioService;
import dev.codecrafter.user.dto.*;
import dev.codecrafter.user.entity.User;
import dev.codecrafter.user.entity.UserProfile;
import dev.codecrafter.user.entity.UserStats;
import dev.codecrafter.user.repository.UserProfileRepository;
import dev.codecrafter.user.repository.UserRepository;
import dev.codecrafter.user.repository.UserStatsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;
    private final UserStatsRepository statsRepository;
    private final MinioService minioService;

    @Transactional(readOnly = true)
    public UserProfileDto getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.notFound("Profile not found"));
        return toUserProfileDto(user, profile);
    }

    @Transactional
    public UserProfileDto updateMyProfile(Long userId, UpdateProfileRequest req) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.notFound("Profile not found"));

        if (req.displayName() != null) profile.setDisplayName(req.displayName());
        if (req.bio() != null) profile.setBio(req.bio());
        if (req.location() != null) profile.setLocation(req.location());
        if (req.company() != null) profile.setCompany(req.company());
        if (req.school() != null) profile.setSchool(req.school());
        if (req.githubUrl() != null) profile.setGithubUrl(req.githubUrl());
        if (req.linkedinUrl() != null) profile.setLinkedinUrl(req.linkedinUrl());
        if (req.twitterUrl() != null) profile.setTwitterUrl(req.twitterUrl());
        if (req.preferredLanguages() != null) profile.setPreferredLanguages(req.preferredLanguages());

        profileRepository.save(profile);
        return toUserProfileDto(user, profile);
    }

    @Transactional(readOnly = true)
    public PublicProfileDto getPublicProfile(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        UserProfile profile = profileRepository.findByUserId(user.getId())
            .orElseThrow(() -> ApiException.notFound("Profile not found"));
        UserStats stats = statsRepository.findByUserId(user.getId())
            .orElseGet(() -> UserStats.builder().user(user).build());
        return toPublicProfileDto(user, profile, stats);
    }

    public AvatarUploadUrlResponse generateAvatarUploadUrl(Long userId) {
        String objectKey = "avatars/" + userId + "/avatar.jpg";
        String uploadUrl = minioService.generateAvatarUploadUrl(objectKey);
        String publicUrl = minioService.getAvatarPublicUrl(objectKey);
        return new AvatarUploadUrlResponse(uploadUrl, publicUrl);
    }

    @Transactional
    public void confirmAvatarUpdate(Long userId, String publicUrl) {
        UserProfile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() -> ApiException.notFound("Profile not found"));
        profile.setAvatarUrl(publicUrl);
        profileRepository.save(profile);
    }

    private UserProfileDto toUserProfileDto(User user, UserProfile profile) {
        return new UserProfileDto(
            user.getId(),
            user.getEmail(),
            user.getUsername(),
            user.isEmailVerified(),
            profile.getDisplayName(),
            profile.getAvatarUrl(),
            profile.getBio(),
            profile.getLocation(),
            profile.getCompany(),
            profile.getSchool(),
            profile.getGithubUrl(),
            profile.getLinkedinUrl(),
            profile.getTwitterUrl(),
            splitLanguages(profile.getPreferredLanguages()),
            user.getCreatedAt()
        );
    }

    private PublicProfileDto toPublicProfileDto(User user, UserProfile profile, UserStats stats) {
        return new PublicProfileDto(
            user.getId(),
            user.getUsername(),
            profile.getDisplayName(),
            profile.getAvatarUrl(),
            profile.getBio(),
            profile.getLocation(),
            profile.getCompany(),
            profile.getSchool(),
            profile.getGithubUrl(),
            profile.getLinkedinUrl(),
            profile.getTwitterUrl(),
            splitLanguages(profile.getPreferredLanguages()),
            new PublicProfileDto.StatsDto(
                stats.getEasySolved(),
                stats.getMediumSolved(),
                stats.getHardSolved(),
                stats.getTotalSolved(),
                stats.getCurrentStreak(),
                stats.getLongestStreak(),
                stats.getRanking() != null ? stats.getRanking() : 0L,
                stats.getReputation()
            ),
            user.getCreatedAt()
        );
    }

    private List<String> splitLanguages(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .toList();
    }
}
