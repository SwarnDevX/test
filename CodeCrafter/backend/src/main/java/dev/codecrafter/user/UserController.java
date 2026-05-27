package dev.codecrafter.user;

import dev.codecrafter.security.AppUserDetails;
import dev.codecrafter.user.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile management")
public class UserController {

    private final UserService userService;

    @GetMapping("/users/me")
    @Operation(summary = "Get the authenticated user's own profile")
    public UserProfileDto getMe(@AuthenticationPrincipal AppUserDetails principal) {
        return userService.getMyProfile(principal.getId());
    }

    @PutMapping("/users/me/profile")
    @Operation(summary = "Update the authenticated user's profile")
    public UserProfileDto updateProfile(
        @AuthenticationPrincipal AppUserDetails principal,
        @Valid @RequestBody UpdateProfileRequest req
    ) {
        return userService.updateMyProfile(principal.getId(), req);
    }

    @GetMapping("/users/me/avatar-upload-url")
    @Operation(summary = "Get a presigned URL to upload your avatar to MinIO")
    public AvatarUploadUrlResponse getAvatarUploadUrl(@AuthenticationPrincipal AppUserDetails principal) {
        return userService.generateAvatarUploadUrl(principal.getId());
    }

    @PostMapping("/users/me/avatar")
    @Operation(summary = "Confirm avatar upload and persist the public URL")
    public Map<String, String> confirmAvatar(
        @AuthenticationPrincipal AppUserDetails principal,
        @RequestBody Map<String, String> body
    ) {
        String publicUrl = body.get("publicUrl");
        if (publicUrl == null || publicUrl.isBlank()) {
            throw dev.codecrafter.common.exception.ApiException.badRequest("publicUrl is required");
        }
        userService.confirmAvatarUpdate(principal.getId(), publicUrl);
        return Map.of("message", "Avatar updated successfully");
    }

    @GetMapping("/u/{username}")
    @Operation(summary = "Get a user's public profile by username")
    public PublicProfileDto getPublicProfile(@PathVariable String username) {
        return userService.getPublicProfile(username);
    }
}
