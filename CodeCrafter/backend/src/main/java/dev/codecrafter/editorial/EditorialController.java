package dev.codecrafter.editorial;

import dev.codecrafter.editorial.dto.EditorialDto;
import dev.codecrafter.editorial.dto.UpsertEditorialRequest;
import dev.codecrafter.security.AppUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class EditorialController {

    private final EditorialService editorialService;

    @GetMapping("/problems/{slug}/editorial")
    public EditorialDto getEditorial(@PathVariable String slug) {
        return editorialService.getPublishedEditorial(slug);
    }

    @PutMapping("/admin/problems/{slug}/editorial")
    @PreAuthorize("hasRole('ADMIN')")
    public EditorialDto upsert(
            @PathVariable String slug,
            @Valid @RequestBody UpsertEditorialRequest req,
            @AuthenticationPrincipal AppUserDetails principal) {
        return editorialService.upsert(slug, req, principal.getId());
    }

    @GetMapping("/admin/problems/{slug}/editorial")
    @PreAuthorize("hasRole('ADMIN')")
    public EditorialDto getAdminEditorial(@PathVariable String slug) {
        return editorialService.getEditorialForAdmin(slug);
    }
}
