package com.amagetdon.ranking.service;

import com.amagetdon.ranking.entity.LearningRanking;
import com.amagetdon.ranking.repository.LearningRankingRepository;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class LearningRankingService {
    private final LearningRankingRepository learningRankingRepository;
    private final UserRepository userRepository;
    private final LearningCalculationService learningCalculationService;

    // 매일 자정에 실행되는 학습 랭킹 집계 로직
    @Transactional
    public void aggregateLearningRankings() {
        log.info("=== 학습 랭킹 집계 시작: {} ===", LocalDateTime.now());

        try {
            // 기존 랭킹 데이터 모두 삭제
            learningRankingRepository.deleteAll();
            log.info("기존 랭킹 데이터 삭제 완료");

            // 모든 유저의 총 정답 개수 계산
            Map<Long, Integer> userCorrectMap = calculateAllUserCorrects();
            log.info("총 {}명의 유저 학습 점수 계산 완료", userCorrectMap.size());

            // 정답 개수 순으로 정렬하여 순위 매기기
            List<LearningRanking> rankings = createRankingsFromCorrectMap(userCorrectMap);
            log.info("랭킹 생성 완료: {} 건", rankings.size());

            // DB에 저장
            learningRankingRepository.saveAll(rankings);
            log.info("=== 학습 랭킹 집계 완료: {} ===", LocalDateTime.now());
        } catch (Exception e) {
            log.error("학습 랭킹 집계 중 오류 발생", e);
            throw e;
        }
    }

    // 모든 유저의 총 정답 개수를 계산
    private Map<Long, Integer> calculateAllUserCorrects() {
        Map<Long, Integer> userCorrectMap = new HashMap<>();

        // 모든 유저 조회
        List<User> users = userRepository.findAll();

        for(User user : users) {
            try{
                Integer correctCount = learningCalculationService.calculateUserCorrectCount(user.getUserId());
                userCorrectMap.put(user.getUserId(), correctCount);
            } catch (Exception e) {
                log.error("유저 {} 학습 점수 계산 실패", user.getUserId(), e);
                userCorrectMap.put(user.getUserId(), 0);
            }
        }

        return userCorrectMap;
    }

    // 정답 개수 맵을 기반으로 랭킹 리스트를 생성
    private List<LearningRanking> createRankingsFromCorrectMap(Map<Long, Integer> userCorrectMap) {
        List<LearningRanking> rankings = new ArrayList<>();

        // 정답 개수 순으로 정렬(내림차순)
        List<Map.Entry<Long, Integer>> sortedEntries = userCorrectMap.entrySet().stream()
                .sorted(Map.Entry.comparingByValue(Comparator.reverseOrder()))
                .toList();

        // 순위 매기기
        int rank = 1;
        LocalDateTime now = LocalDateTime.now();

        for(Map.Entry<Long, Integer> entry : sortedEntries) {
            LearningRanking ranking = LearningRanking.builder()
                    .userId(entry.getKey())
                    .rank(rank++)
                    .totalCorrect(entry.getValue())
                    .updatedAt(now)
                    .build();
            rankings.add(ranking);
        }

        return rankings;
    }
}
