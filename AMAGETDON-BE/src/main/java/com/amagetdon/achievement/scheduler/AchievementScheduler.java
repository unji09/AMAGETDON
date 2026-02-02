package com.amagetdon.achievement.scheduler;

import com.amagetdon.achievement.service.AchievementService;
import com.amagetdon.trading.dto.response.AssetResponse;
import com.amagetdon.trading.service.AssetService;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.RoundingMode;
import java.util.List;

import static com.amagetdon.achievement.entity.AchievementIdCode.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class AchievementScheduler {
    // 매일 자정(00:00:00)에 실행
    private static final String MIDNIGHT_CRON = "0 0 0 * * *";

    private final UserRepository userRepository;
    private final AssetService assetService;
    private final AchievementService achievementService;

    @Scheduled(cron = MIDNIGHT_CRON)
    public void checkDailyAchievements() {
        List<Long> userIds = userRepository.findAll()
                .stream()
                .map(User::getUserId)
                .toList();

        for (Long userId : userIds) {
            checkUserAchievements(userId);
        }
    }

    private void checkUserAchievements(Long userId) {
        AssetResponse asset = assetService.getAsset(userId);
        long totalAsset = asset.totalAsset();
        long totalProfitRate = asset.totalProfitRate()
                .setScale(0, RoundingMode.DOWN)
                .longValue();

        achievementService.checkAndAwardAchievements(userId, totalAsset, BILLIONAIRE);
        achievementService.checkAndAwardAchievements(userId, totalAsset, TEN_MILLION_CLUB);
        achievementService.checkAndAwardAchievements(userId, totalProfitRate, HALF_PROFIT);
        achievementService.checkAndAwardAchievements(userId, totalProfitRate, CRASH_LOSS);
    }
}
