package com.amagetdon.achievement.dto;

import com.amagetdon.achievement.entity.AchievementCategory;

import java.time.LocalDateTime;
import java.util.List;

public record AchievementResponse(
        int totalCount,
        int achievedCount,
        List<AchievementItem> achievements
) {
    public record AchievementItem(
            Long achievementId,
            String achievementName,
            AchievementCategory achievementCategory,
            String achievementIcon,
            String achievementContent,
            boolean isAchieved,
            LocalDateTime achievedAt
    ) {}
}
