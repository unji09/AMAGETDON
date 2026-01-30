package com.amagetdon.ranking.service;

import com.amagetdon.learning.entity.DailyQuizHistory;
import com.amagetdon.learning.repository.DailyQuizHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LearningCalculationService {

    private final DailyQuizHistoryRepository dailyQuizHistoryRepository;

    // 특정 유저의 총 정답 개수를 계산
    public Integer calculateUserCorrectCount(Long userId) {
        // 유저의 전체 퀴즈 히스토리 조회
        List<DailyQuizHistory> histories = dailyQuizHistoryRepository.findByUserId(userId);

        // 정답 개수 카운팅
        int correctCount = 0;
        for (DailyQuizHistory history : histories) {
            if (history.getIsCorrect()) {
                correctCount++;
            }
        }

        log.debug("유저 {} 학습 점수: 총 {}개 정답", userId, correctCount);

        return correctCount;
    }
}
