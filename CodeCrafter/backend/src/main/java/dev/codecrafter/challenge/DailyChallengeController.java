package dev.codecrafter.challenge;

import dev.codecrafter.challenge.dto.DailyChallengeDto;
import dev.codecrafter.challenge.dto.SetDailyChallengeRequest;
import dev.codecrafter.security.AppUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/daily-challenge")
@RequiredArgsConstructor
public class DailyChallengeController {

    private final DailyChallengeService dailyChallengeService;

    @GetMapping
    public DailyChallengeDto getToday(@AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        return dailyChallengeService.getToday(viewerId);
    }

    @GetMapping("/{date}")
    public DailyChallengeDto getByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal AppUserDetails principal) {
        Long viewerId = principal != null ? principal.getId() : null;
        return dailyChallengeService.getByDate(date, viewerId);
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public DailyChallengeDto set(@Valid @RequestBody SetDailyChallengeRequest req) {
        return dailyChallengeService.set(req);
    }
}
