package com.amagetdon.achievement.controller;

import com.amagetdon.achievement.dto.AchievementFilter;
import com.amagetdon.achievement.dto.AchievementResponse;
import com.amagetdon.achievement.repository.AchievementRedisRepository;
import com.amagetdon.achievement.service.AchievementService;
import com.amagetdon.common.security.SecurityUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "업적 테스트", description = "업적 달성 테스트용 API (개발용, JWT 필요)")
@RestController
@RequiredArgsConstructor
@RequestMapping("/achievements/test")
public class AchievementTestController {

    private final AchievementRedisRepository achievementRedisRepository;
    private final AchievementService achievementService;

    @Operation(summary = "Redis 카운터 증가 + 업적 체크",
            description = "conditionKey의 카운터를 1 증가시킨 후 해당 업적 달성 여부를 체크합니다.")
    @PostMapping("/redis/{achievementId}")
    public Map<String, Object> testRedisAchievement(
            @Parameter(description = "업적 ID", example = "4")
            @PathVariable Long achievementId,
            @Parameter(description = "Redis conditionKey", example = "total_bought_count")
            @RequestParam String conditionKey
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        Long count = achievementRedisRepository.increment(userId, conditionKey);
        achievementService.checkAndAwardAchievements(userId, count, achievementId);

        return Map.of(
                "userId", userId,
                "conditionKey", conditionKey,
                "currentCount", count,
                "achievementId", achievementId
        );
    }

    @Operation(summary = "DB 값 기반 업적 체크",
            description = "직접 currentValue를 전달하여 업적 달성 여부를 체크합니다.")
    @PostMapping("/db/{achievementId}")
    public Map<String, Object> testDbAchievement(
            @Parameter(description = "업적 ID", example = "6")
            @PathVariable Long achievementId,
            @Parameter(description = "비교할 현재 값", example = "0")
            @RequestParam Long currentValue
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        achievementService.checkAndAwardAchievements(userId, currentValue, achievementId);

        return Map.of(
                "userId", userId,
                "currentValue", currentValue,
                "achievementId", achievementId
        );
    }

    @Operation(summary = "Redis 카운터 현재값 조회")
    @GetMapping("/redis/value")
    public Map<String, Object> getRedisValue(
            @Parameter(description = "Redis conditionKey", example = "total_bought_count")
            @RequestParam String conditionKey
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        Long value = achievementRedisRepository.getValue(userId, conditionKey);

        return Map.of(
                "userId", userId,
                "conditionKey", conditionKey,
                "currentValue", value
        );
    }

    @Operation(summary = "내 업적 현황 조회 (테스트용)")
    @GetMapping("/me")
    public AchievementResponse getMyTestAchievements(
            @Parameter(description = "필터: ALL/ACHIEVED/LOCKED", example = "ALL")
            @RequestParam(defaultValue = "ALL") AchievementFilter filter
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        return achievementService.getMyAchievements(userId, filter);
    }
}
