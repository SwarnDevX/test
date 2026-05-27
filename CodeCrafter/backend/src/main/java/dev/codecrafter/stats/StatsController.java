package dev.codecrafter.stats;

import dev.codecrafter.stats.dto.UserStatsDetailDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/u/{username}/stats")
@RequiredArgsConstructor
public class StatsController {

    private final StatsService statsService;

    @GetMapping
    public UserStatsDetailDto getStats(@PathVariable String username) {
        return statsService.getStatsDetail(username);
    }
}
