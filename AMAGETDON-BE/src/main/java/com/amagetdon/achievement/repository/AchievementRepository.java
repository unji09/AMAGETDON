package com.amagetdon.achievement.repository;

import com.amagetdon.achievement.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    List<Achievement> findAllByOrderByAchievementIdAsc();
}
