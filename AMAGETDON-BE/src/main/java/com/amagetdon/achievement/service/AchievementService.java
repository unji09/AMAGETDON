package com.amagetdon.achievement.service;

import com.amagetdon.achievement.dto.AchievementFilter;
import com.amagetdon.achievement.dto.AchievementResponse;
import com.amagetdon.achievement.entity.Achievement;
import com.amagetdon.achievement.entity.UserAchievement;
import com.amagetdon.achievement.repository.AchievementRepository;
import com.amagetdon.achievement.repository.UserAchievementRepository;
import com.amagetdon.common.ErrorCode;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AchievementService {

    private static final Long REWARD_AMOUNT = 1_000_000L;

    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;
    private final StringRedisTemplate redisTemplate;

    public AchievementResponse getMyAchievements(Long userId, AchievementFilter filter) {
        List<Achievement> allAchievements = achievementRepository.findAllByOrderByAchievementIdAsc();

        Map<Long, UserAchievement> userAchievementMap = getUserAchievementMap(userId);

        int totalCount = allAchievements.size();
        int achievedCount = 0;
        List<AchievementResponse.AchievementItem> items = new ArrayList<>();

        for (Achievement achievement : allAchievements) {
            UserAchievement ua = userAchievementMap.get(achievement.getAchievementId());
            boolean isAchieved = ua != null && ua.isAchieved();

            if (isAchieved) {
                achievedCount++;
            }

            if (filter == AchievementFilter.ACHIEVED && !isAchieved) {
                continue;
            }
            if (filter == AchievementFilter.LOCKED && isAchieved) {
                continue;
            }

            if (isAchieved) {
                items.add(new AchievementResponse.AchievementItem(
                        achievement.getAchievementId(),
                        achievement.getAchievementName(),
                        achievement.getAchievementCategory(),
                        achievement.getAchievementIcon(),
                        achievement.getAchievementContent(),
                        true,
                        ua.getAchievedAt()
                ));
            } else {
                items.add(new AchievementResponse.AchievementItem(
                        achievement.getAchievementId(),
                        achievement.getAchievementName(),
                        achievement.getAchievementCategory(),
                        null,
                        null,
                        false,
                        null
                ));
            }
        }

        return new AchievementResponse(totalCount, achievedCount, items);
    }

    @Transactional
    public void checkAndAwardAchievements(Long userId, Long currentValue, Long achievementId) {
        Achievement achievement = achievementRepository.findById(achievementId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.ACHIEVEMENT_NOT_FOUND.getMessage()));

        UserAchievement.UserAchievementId uaId =
                new UserAchievement.UserAchievementId(userId, achievementId);

        if (userAchievementRepository.existsById(uaId)) {
            return;
        }

        if (!achievement.isAchieved(currentValue)) {
            return;
        }

        UserAchievement userAchievement = UserAchievement.create(userId, achievementId);
        userAchievement.achieve(LocalDateTime.now());
        userAchievementRepository.save(userAchievement);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));
        user.addBalance(REWARD_AMOUNT);

        redisTemplate.convertAndSend("achievement:granted", userId.toString());
    }

    private Map<Long, UserAchievement> getUserAchievementMap(Long userId) {
        List<UserAchievement> userAchievements = userAchievementRepository.findAllByIdUserId(userId);
        Map<Long, UserAchievement> map = new HashMap<>();
        for (UserAchievement ua : userAchievements) {
            map.put(ua.getId().getAchievementId(), ua);
        }
        return map;
    }
}
