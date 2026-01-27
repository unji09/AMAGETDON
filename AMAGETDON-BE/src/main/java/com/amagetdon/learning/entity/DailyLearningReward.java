package com.amagetdon.learning.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "daily_learning_rewards")
@Getter
@NoArgsConstructor
public class DailyLearningReward {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reward_id")
    private Long rewardId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "quiz_reward_date", nullable = false)
    private LocalDate quizRewardDate;

    @Column(name = "review_reward_date", nullable = false)
    private LocalDate reviewRewardDate;

    public DailyLearningReward(Long userId) {
        this.userId = userId;
        this.quizRewardDate = LocalDate.now();
        this.reviewRewardDate = LocalDate.now();
    }

    public void updateQuizRewardDate() {
        this.quizRewardDate = LocalDate.now();
    }

    public void updateReviewRewardDate() {
        this.reviewRewardDate = LocalDate.now();
    }
}