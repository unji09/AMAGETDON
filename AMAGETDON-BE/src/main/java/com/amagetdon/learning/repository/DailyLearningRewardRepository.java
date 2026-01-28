package com.amagetdon.learning.repository;

import com.amagetdon.learning.entity.DailyLearningReward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface DailyLearningRewardRepository extends JpaRepository<DailyLearningReward, Long> {

    /**
     * 사용자의 보상 정보 조회
     */
    Optional<DailyLearningReward> findByUserId(Long userId);

    /**
     * 오늘 퀴즈 보상을 이미 받았는지 확인
     */
    boolean existsByUserIdAndQuizRewardDate(Long userId, LocalDate quizRewardDate);

    /**
     * 오늘 오답노트 보상을 이미 받았는지 확인
     */
    boolean existsByUserIdAndReviewRewardDate(Long userId, LocalDate reviewRewardDate);
}