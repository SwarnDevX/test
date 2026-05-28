package dev.codecrafter.user;

import dev.codecrafter.problem.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public PageResponse<AdminUserDto> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search) {
        return adminUserService.list(page, size, search);
    }

    @PatchMapping("/{userId}/ban")
    public Map<String, String> ban(@PathVariable Long userId) {
        adminUserService.setBanned(userId, true);
        return Map.of("message", "User banned");
    }

    @PatchMapping("/{userId}/unban")
    public Map<String, String> unban(@PathVariable Long userId) {
        adminUserService.setBanned(userId, false);
        return Map.of("message", "User unbanned");
    }

    @PostMapping("/{userId}/roles")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addRole(
            @PathVariable Long userId,
            @Valid @RequestBody Map<String, String> body) {
        adminUserService.addRole(userId, body.get("role"));
    }

    @DeleteMapping("/{userId}/roles/{roleName}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeRole(
            @PathVariable Long userId,
            @PathVariable String roleName) {
        adminUserService.removeRole(userId, roleName);
    }
}
