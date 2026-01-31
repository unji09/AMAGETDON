package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.quiz.QuizResponse;
import com.amagetdon.learning.entity.DailyQuizHistory;
import com.amagetdon.learning.repository.CachedQuizRepository;
import com.amagetdon.learning.repository.DailyQuizHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Transactional
@ActiveProfiles("test")
class QuizServiceIntegrationTest {

    @Autowired
    private QuizService quizService;

    @Autowired
    private DailyQuizHistoryRepository historyRepository;

    @Autowired
    private CachedQuizRepository cachedQuizRepository;

    private Long testUserId;
    private LocalDate today;

    @BeforeEach
    void setUp() {
        testUserId = 999L;
        today = LocalDate.now();

        // 기존 테스트 데이터 정리
        historyRepository.deleteAll();
    }

    @Test
    @DisplayName("101번째 퀴즈 요청 시 FastAPI를 통해 캐싱 퀴즈 생성 및 반환")
    void cachingQuizGenerationTest() {
        // Given: 100개 히스토리 생성
        System.out.println("\n========================================");
        System.out.println("TEST: 101번째 퀴즈 생성 테스트 시작");
        System.out.println("========================================\n");

        for (int i = 1; i <= 100; i++) {
            DailyQuizHistory history = new DailyQuizHistory(
                    testUserId,
                    (long) i,
                    i,
                    true
            );
            historyRepository.save(history);
        }

        System.out.println("✅ Given: 100개 히스토리 생성 완료");
        System.out.println("📋 User ID: " + testUserId);
        System.out.println("📅 Date: " + today);

        // When: 101번째 퀴즈 요청
        System.out.println("\n🔄 When: 101번째 퀴즈 요청 중...\n");

        QuizResponse response = quizService.getDailyQuiz(testUserId);

        // Then: 캐싱 퀴즈 반환 확인
        printQuizDetails(response, "101번째 퀴즈 응답 결과");

        assertThat(response).isNotNull();
        assertThat(response.quizSequence()).isEqualTo(101);
        assertThat(response.isQuizRewardReceived()).isFalse();
        assertThat(response.quiz()).isNotNull();
        assertThat(response.quiz().content()).isNotBlank();
    }

    @Test
    @DisplayName("1~100번 퀴즈는 기존 테이블에서 조회")
    void existingQuizRetrievalTest() {
        System.out.println("\n========================================");
        System.out.println("TEST: 1번째 퀴즈 조회 테스트 시작");
        System.out.println("========================================\n");

        // When: 1번째 퀴즈 요청
        QuizResponse response = quizService.getDailyQuiz(testUserId);

        // Then: 기존 퀴즈 반환
        printQuizDetails(response, "1번째 퀴즈 응답 결과 (Quiz ID: " + response.quiz().quizId() + ")");

        assertThat(response).isNotNull();
        assertThat(response.quizSequence()).isEqualTo(1);
        assertThat(response.quiz()).isNotNull();
    }

    @Test
    @DisplayName("미사용 캐싱 퀴즈가 있으면 FastAPI 호출 없이 즉시 반환")
    void cachedQuizReuseTest() {
        System.out.println("\n========================================");
        System.out.println("TEST: 캐싱 퀴즈 재사용 테스트 시작");
        System.out.println("========================================\n");

        // Given: 100개 히스토리 + 미사용 캐싱 퀴즈 존재
        for (int i = 1; i <= 100; i++) {
            DailyQuizHistory history = new DailyQuizHistory(
                    testUserId,
                    (long) i,
                    i,
                    true
            );
            historyRepository.save(history);
        }

        System.out.println("✅ Given: 첫 번째 사용자 100개 히스토리 생성 완료");

        // 먼저 101번째 요청으로 캐싱 퀴즈 1개 생성
        System.out.println("🔄 첫 번째 사용자 101번째 퀴즈 요청 (FastAPI 호출)...\n");

        try {
            QuizResponse firstResponse = quizService.getDailyQuiz(testUserId);
            printQuizDetails(firstResponse, "첫 번째 사용자 101번째 퀴즈");
        } catch (Exception e) {
            System.err.println("❌ 첫 번째 퀴즈 생성 실패: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("FastAPI call failed", e);
        }

        // 미사용 캐싱 퀴즈 개수 확인
        Integer unusedCount = cachedQuizRepository.countByIsUsed(false);
        System.out.println("📦 미사용 캐싱 퀴즈 개수: " + unusedCount);

        assertThat(unusedCount).isGreaterThan(0);

        // When: 다른 사용자가 101번째 요청
        Long anotherUserId = 888L;
        for (int i = 1; i <= 100; i++) {
            DailyQuizHistory history = new DailyQuizHistory(
                    anotherUserId,
                    (long) i,
                    i,
                    true
            );
            historyRepository.save(history);
        }

        System.out.println("✅ 두 번째 사용자 100개 히스토리 생성 완료");
        System.out.println("🔄 두 번째 사용자 101번째 퀴즈 요청 (캐싱 재사용)...\n");

        QuizResponse response = quizService.getDailyQuiz(anotherUserId);

        // Then: FastAPI 호출 없이 기존 캐싱 퀴즈 반환
        printQuizDetails(response, "두 번째 사용자 101번째 퀴즈");

        assertThat(response).isNotNull();
        assertThat(response.quizSequence()).isEqualTo(101);
    }

    /**
     * 퀴즈 상세 정보 출력 (MCQ인 경우만 보기 출력)
     */
    private void printQuizDetails(QuizResponse response, String title) {
        System.out.println("\n========================================");
        System.out.println("📊 " + title);
        System.out.println("========================================");
        System.out.println("🔢 Sequence: " + response.quizSequence());
        System.out.println("🎁 Reward Received: " + response.isQuizRewardReceived());
        System.out.println("📝 Quiz Type: " + response.quiz().quizType());
        System.out.println("❓ Content: " + response.quiz().content());

        // MCQ일 때만 보기 출력
        if (response.quiz().quizType().toString().equals("MCQ") && response.quiz().choices() != null) {
            System.out.println("\n📌 Choices:");
            response.quiz().choices().forEach(choice ->
                    System.out.println("  " + choice.choiceOrder() + ". " + choice.choiceText())
            );
        } else if (response.quiz().quizType().toString().equals("OX")) {
            System.out.println("\n✅ OX Quiz (O/X로 답변)");
        }

        System.out.println("========================================\n");
    }
}