package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.quiz.QuizResponse;
import com.amagetdon.learning.dto.quiz.QuizSubmitRequest;
import com.amagetdon.learning.dto.quiz.QuizSubmitResponse;
import com.amagetdon.learning.entity.*;
import com.amagetdon.learning.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizChoiceRepository quizChoiceRepository;
    private final DailyQuizHistoryRepository historyRepository;
    private final ReviewNoteRepository reviewNoteRepository;
    private final DailyLearningRewardRepository rewardRepository;

    // 새로 추가
    private final CachedQuizRepository cachedQuizRepository;
    private final CachedQuizChoiceRepository cachedQuizChoiceRepository;
    private final FastApiService fastApiService;

    private static final Integer DAILY_QUIZ_LIMIT = 100;
    private static final Integer CACHED_QUIZ_BUFFER_SIZE = 100;  // TODO(민규): 배포시 1000으로 증가

    /**
     * 오늘의 퀴즈 1개 조회
     */
    public QuizResponse getDailyQuiz(Long userId) {
        LocalDate today = LocalDate.now();

        // 1. 현재 sequence 계산
        Integer currentSequence = historyRepository
                .findMaxSequenceByUserIdAndQuizDate(userId, today);
        Integer nextSequence = (currentSequence == null) ? 1 : currentSequence + 1;

        // 2. 100개 이하: 기존 로직
        if (nextSequence <= DAILY_QUIZ_LIMIT) {
            return getDailyQuizUnder100(userId, today, nextSequence);
        }

        // 3. 100개 초과: 캐싱 퀴즈 로직
        return getDailyQuizOver100(userId, today, nextSequence);
    }

    /**
     * 1~100번 퀴즈 조회 (기존 로직)
     */
    private QuizResponse getDailyQuizUnder100(Long userId, LocalDate today, Integer nextSequence) {
        // 1. 전체 퀴즈 ID 조회
        List<Long> allQuizIds = quizRepository.findAllQuizIds();

        // 2. 오늘 이미 푼 퀴즈 ID 제외
        List<Long> solvedQuizIds = historyRepository
                .findQuizIdsByUserIdAndQuizDate(userId, today);
        allQuizIds.removeAll(solvedQuizIds);

        // 3. 남은 퀴즈가 없으면 예외
        if (allQuizIds.isEmpty()) {
            throw new IllegalStateException("더 이상 풀 수 있는 퀴즈가 없습니다");
        }

        // 4. 랜덤 선택
        Collections.shuffle(allQuizIds);
        Long nextQuizId = allQuizIds.get(0);

        // 5. Quiz 조회
        Quiz quiz = quizRepository.findById(nextQuizId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 퀴즈입니다"));

        // 6. 오늘 퀴즈 보상 받았는지 확인
        Boolean isQuizRewardReceived = rewardRepository
                .existsByUserIdAndQuizRewardDate(userId, today);

        // 7. DTO 변환
        return convertToQuizResponse(quiz, nextSequence, isQuizRewardReceived);
    }

    /**
     * 101번~ 무한 퀴즈 조회 (캐싱 퀴즈)
     */
    private QuizResponse getDailyQuizOver100(Long userId, LocalDate today, Integer nextSequence) {
        // 1. 미사용 캐싱 퀴즈 조회
        Optional<CachedQuiz> cachedQuizOpt = cachedQuizRepository.findRandomUnusedQuiz();

        if (cachedQuizOpt.isPresent()) {
            // 미사용 퀴즈 있음 -> 즉시 반환
            CachedQuiz cachedQuiz = cachedQuizOpt.get();
            cachedQuiz.markAsUsed();  // 사용 처리
            cachedQuizRepository.save(cachedQuiz);

            log.info("캐싱 퀴즈 사용: cachedQuizId={}, userId={}, sequence={}",
                    cachedQuiz.getCachedQuizId(), userId, nextSequence);

            return convertCachedQuizToResponse(cachedQuiz, nextSequence);
        }

        // 2. 미사용 퀴즈 없음 -> 미사용 개수 확인
        Integer unusedCount = cachedQuizRepository.countByIsUsed(false);

        if (unusedCount >= CACHED_QUIZ_BUFFER_SIZE) {
            // 100개 이상 -> 대기 안내
            throw new IllegalStateException("퀴즈 생성 중입니다. 잠시 후 다시 시도해주세요");
        }

        // 3. 100개 미만 -> FastAPI 호출하여 생성
        log.info("FastAPI 퀴즈 생성 요청: unusedCount={}", unusedCount);
        fastApiService.requestQuizGeneration(1, "RANDOM", "RANDOM");

        // 4. 생성 요청 후 재조회 (polling 방식)
        int maxRetries = 5;
        int retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                Thread.sleep(1000);  // 1초 대기
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("퀴즈 생성 중 오류가 발생했습니다");
            }

            Optional<CachedQuiz> newQuizOpt = cachedQuizRepository.findRandomUnusedQuiz();
            if (newQuizOpt.isPresent()) {
                CachedQuiz newQuiz = newQuizOpt.get();
                newQuiz.markAsUsed();
                cachedQuizRepository.save(newQuiz);

                log.info("생성된 캐싱 퀴즈 사용: cachedQuizId={}", newQuiz.getCachedQuizId());
                return convertCachedQuizToResponse(newQuiz, nextSequence);
            }

            retryCount++;
        }

        throw new RuntimeException("퀴즈 생성에 실패했습니다. 다시 시도해주세요");
    }

    /**
     * 퀴즈 답안 제출
     */
    public QuizSubmitResponse submitQuiz(Long userId, QuizSubmitRequest request) {
        LocalDate today = LocalDate.now();

        // 1. 현재 sequence 계산 (서버에서!)
        Integer currentSequence = historyRepository
                .findMaxSequenceByUserIdAndQuizDate(userId, today);
        Integer nextSequence = (currentSequence == null) ? 1 : currentSequence + 1;

        // 2. 100개 이하만 처리 (100개 초과는 제출 불가)
        if (nextSequence > DAILY_QUIZ_LIMIT) {
            throw new IllegalArgumentException("100개 초과 퀴즈는 제출할 수 없습니다");
        }

        // 3. 퀴즈 존재 여부
        Quiz quiz = quizRepository.findById(request.quizId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 퀴즈입니다"));

        // 4. 중복 제출 방지
        boolean alreadySolved = historyRepository
                .existsByUserIdAndQuizIdAndQuizDate(userId, request.quizId(), today);
        if (alreadySolved) {
            throw new IllegalArgumentException("이미 푼 문제입니다");
        }

        // 5. 정답 체크
        boolean isCorrect = checkAnswer(quiz, request);

        // 6. 히스토리 저장
        DailyQuizHistory history = new DailyQuizHistory(
                userId,
                request.quizId(),
                nextSequence,
                isCorrect
        );
        historyRepository.save(history);

        // 7. 틀렸으면 오답노트 저장
        boolean addedToReviewNote = false;
        if (!isCorrect) {
            boolean alreadyInReviewNote = reviewNoteRepository
                    .existsByUserAndQuiz(userId, request.quizId());

            if (!alreadyInReviewNote) {
                ReviewNote reviewNote = new ReviewNote(userId, quiz);
                reviewNoteRepository.save(reviewNote);
                addedToReviewNote = true;
            }
        }

        // 8. 보상 지급
        Integer rewardAmount = calculateRewardAmount(nextSequence);

        // TODO(민규): User balance 업데이트
        Long currentBalance = 3000000L + rewardAmount;

        // 9. 정답 문자열 생성
        String correctAnswer = getCorrectAnswerString(quiz);

        return new QuizSubmitResponse(
                isCorrect,
                correctAnswer,
                rewardAmount,
                addedToReviewNote,
                currentBalance
        );
    }

    private boolean checkAnswer(Quiz quiz, QuizSubmitRequest request) {
        if (quiz.getQuizType() == QuizType.OX) {
            Boolean userAnswer = request.getOxAnswerValue();
            if (userAnswer == null) {
                throw new IllegalArgumentException("OX 답안이 올바르지 않습니다");
            }
            return userAnswer.equals(quiz.getAnswerOx());

        } else {
            Long userChoiceId = request.getChoiceId();
            if (userChoiceId == null) {
                throw new IllegalArgumentException("객관식 답안이 올바르지 않습니다");
            }

            QuizChoice userChoice = quizChoiceRepository.findById(userChoiceId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 선택지입니다"));

            return userChoice.getIsAnswer();
        }
    }

    private Integer calculateRewardAmount(Integer quizSequence) {
        if (quizSequence < 1 || quizSequence > DAILY_QUIZ_LIMIT) {
            return 0;
        }

        if (quizSequence == 1) {
            return 100_000;
        } else {
            return 1_000;
        }
    }

    private String getCorrectAnswerString(Quiz quiz) {
        if (quiz.getQuizType() == QuizType.OX) {
            return quiz.getAnswerOx() ? "O" : "X";
        } else {
            List<QuizChoice> choices = quizChoiceRepository.findByQuizId(quiz.getQuizId());

            return choices.stream()
                    .filter(QuizChoice::getIsAnswer)
                    .findFirst()
                    .map(choice -> String.valueOf(choice.getChoiceId()))
                    .orElseThrow(() -> new IllegalStateException("정답이 설정되지 않은 퀴즈입니다"));
        }
    }

    private QuizResponse convertToQuizResponse(
            Quiz quiz,
            Integer quizSequence,
            Boolean isQuizRewardReceived
    ) {
        List<QuizResponse.ChoiceInfo> choices = null;
        if (quiz.getQuizType() == QuizType.MCQ) {
            List<QuizChoice> quizChoices = quizChoiceRepository.findByQuizId(quiz.getQuizId());

            choices = quizChoices.stream()
                    .map(choice -> new QuizResponse.ChoiceInfo(
                            choice.getChoiceId(),
                            choice.getChoiceText(),
                            choice.getChoiceNo()
                    ))
                    .collect(Collectors.toList());
        }

        QuizResponse.QuizDetail quizDetail = new QuizResponse.QuizDetail(
                quiz.getQuizId(),
                quiz.getQuizType(),
                quiz.getQuizContent(),
                choices
        );

        return new QuizResponse(
                quizSequence,
                isQuizRewardReceived,
                quizDetail
        );
    }

    /**
     * CachedQuiz를 QuizResponse로 변환
     */
    private QuizResponse convertCachedQuizToResponse(
            CachedQuiz cachedQuiz,
            Integer quizSequence
    ) {
        List<QuizResponse.ChoiceInfo> choices = null;
        if (cachedQuiz.getQuizType() == QuizType.MCQ) {
            List<CachedQuizChoice> cachedChoices = cachedQuizChoiceRepository
                    .findByCachedQuizId(cachedQuiz.getCachedQuizId());

            choices = cachedChoices.stream()
                    .map(choice -> new QuizResponse.ChoiceInfo(
                            choice.getCachedChoiceId(),
                            choice.getChoiceText(),
                            choice.getChoiceNo()
                    ))
                    .collect(Collectors.toList());
        }

        QuizResponse.QuizDetail quizDetail = new QuizResponse.QuizDetail(
                cachedQuiz.getCachedQuizId(),
                cachedQuiz.getQuizType(),
                cachedQuiz.getQuizContent(),
                choices
        );

        // 100개 초과는 보상 없음
        return new QuizResponse(
                quizSequence,
                false,  // 보상 받지 않음
                quizDetail
        );
    }
}