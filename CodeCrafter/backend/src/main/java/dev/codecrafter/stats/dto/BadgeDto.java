package dev.codecrafter.stats.dto;

import dev.codecrafter.stats.entity.UserBadge;

import java.time.Instant;

public record BadgeDto(
    String slug,
    String name,
    String description,
    String icon,
    Instant awardedAt
) {
    public static BadgeDto from(UserBadge ub) {
        return new BadgeDto(
            ub.getBadge().getSlug(),
            ub.getBadge().getName(),
            ub.getBadge().getDescription(),
            ub.getBadge().getIcon(),
            ub.getAwardedAt()
        );
    }
}
