package dev.codecrafter.user;

import dev.codecrafter.common.exception.ApiException;
import dev.codecrafter.problem.dto.PageResponse;
import dev.codecrafter.user.entity.Role;
import dev.codecrafter.user.repository.RoleRepository;
import dev.codecrafter.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Transactional(readOnly = true)
    public PageResponse<AdminUserDto> list(int page, int size, String search) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        var result = (search != null && !search.isBlank())
            ? userRepository.findByEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(search, search, pageable)
            : userRepository.findAll(pageable);
        return PageResponse.of(result.map(this::toDto));
    }

    @Transactional
    public void setBanned(Long userId, boolean banned) {
        var user = userRepository.findById(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        user.setActive(!banned);
        userRepository.save(user);
    }

    @Transactional
    public void addRole(Long userId, String roleName) {
        var user = userRepository.findByIdWithRoles(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        String normalized = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName.toUpperCase();
        Role role = roleRepository.findByName(normalized)
            .orElseThrow(() -> ApiException.notFound("Role not found: " + normalized));
        user.getRoles().add(role);
        userRepository.save(user);
    }

    @Transactional
    public void removeRole(Long userId, String roleName) {
        var user = userRepository.findByIdWithRoles(userId)
            .orElseThrow(() -> ApiException.notFound("User not found"));
        String normalized = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName.toUpperCase();
        user.getRoles().removeIf(r -> r.getName().equals(normalized));
        userRepository.save(user);
    }

    private AdminUserDto toDto(dev.codecrafter.user.entity.User u) {
        return new AdminUserDto(
            u.getId(), u.getEmail(), u.getUsername(),
            u.isEmailVerified(), u.isActive(),
            u.getRoles().stream().map(Role::getName).collect(Collectors.toSet()),
            u.getCreatedAt()
        );
    }
}
