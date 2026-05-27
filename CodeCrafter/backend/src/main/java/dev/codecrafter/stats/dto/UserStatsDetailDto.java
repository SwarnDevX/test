package dev.codecrafter.stats.dto;

import java.util.List;

public record UserStatsDetailDto(
    int easySolved,
    int mediumSolved,
    int hardSolved,
    int totalSolved,
    int currentStreak,
    int longestStreak,
    Integer ranking,
    List<HeatmapEntry> heatmap,
    List<LanguageStat> languageBreakdown,
    List<TagStat> topTags,
    List<RecentAcSubmission> recentAc,
    List<BadgeDto> badges
) {}
