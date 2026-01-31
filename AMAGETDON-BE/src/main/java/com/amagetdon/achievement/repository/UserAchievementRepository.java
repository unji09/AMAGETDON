package com.amagetdon.achievement.repository;

import com.amagetdon.achievement.entity.UserAchievement;
import com.amagetdon.achievement.entity.UserAchievement.UserAchievementId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, UserAchievementId> {

    List<UserAchievement> findAllByIdUserId(Long userId);
}
