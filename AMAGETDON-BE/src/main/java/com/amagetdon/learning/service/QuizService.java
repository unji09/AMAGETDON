package com.amagetdon.learning.service;

import com.amagetdon.achievement.entity.AchievementIdCode;
import com.amagetdon.achievement.repository.AchievementRedisRepository;
import com.amagetdon.achievement.service.AchievementService;
import com.amagetdon.learning.dto.quiz.QuizCountResponse;
import com.amagetdon.learning.dto.quiz.QuizResponse;
import com.amagetdon.learning.dto.quiz.QuizSubmitRequest;
import com.amagetdon.learning.dto.quiz.QuizSubmitResponse;
import com.amagetdon.learning.entity.*;
import com.amagetdon.learning.repository.*;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

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
    private final UserRepository userRepository;

    private final CachedQuizRepository cachedQuizRepository;
    private final CachedQuizChoiceRepository cachedQuizChoiceRepository;
    private final FastApiService fastApiService;

    // 업적 관련
    private final AchievementService achievementService;
    private final AchievementRedisRepository achievementRedisRepository;
    private final ProgressService progressService;

    private static final Integer DAILY_QUIZ_LIMIT = 100;
    private static final Integer CACHED_QUIZ_BUFFER_SIZE = 100;
    private static final Integer REQUEST_GENERATE_QUIZ_COUNT = 10;
    private static final Integer BUFFER_THRESHOLD = 20;

    /**
     * 오늘의 퀴즈 1개 조회
     */
    public QuizResponse getDailyQuiz(Long userId) {
        LocalDate today = LocalDate.now();

        // 오늘 맞춘 문제 수 조회
        Integer correctCount = historyRepository
                .countCorrectByUserIdAndQuizDate(userId, today);

        Integer quizSequence = correctCount + 1;

        // 분기: 1~100번 vs 101번 이후
        if (quizSequence <= DAILY_QUIZ_LIMIT) {
            return getDailyQuizUnder100(userId, today, quizSequence);
        } else {
            return getDailyQuizOver100(userId, today, quizSequence);
        }
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
     * 캐시된 퀴즈가 있으면 즉시 반환, 없으면 비동기 생성 트리거 후 202 응답
     */
    private QuizResponse getDailyQuizOver100(Long userId, LocalDate today, Integer nextSequence) {
        // 1. 미사용 캐싱 퀴즈 조회
        Optional<CachedQuiz> cachedQuizOpt = cachedQuizRepository.findRandomUnusedQuiz();

        if (cachedQuizOpt.isPresent()) {
            CachedQuiz cachedQuiz = cachedQuizOpt.get();
            cachedQuiz.markAsUsed();
            cachedQuizRepository.save(cachedQuiz);

            log.info("캐싱 퀴즈 사용: cachedQuizId={}, userId={}, sequence={}",
                    cachedQuiz.getCachedQuizId(), userId, nextSequence);

            // 선제적 보충: 남은 미사용 퀴즈가 임계값 이하이면 백그라운드 생성
            triggerPreemptiveGeneration();

            return convertCachedQuizToResponse(cachedQuiz, nextSequence);
        }

        // 2. 캐시된 퀴즈 없음 → 비동기로 생성 트리거하고 202 응답
        log.info("캐싱 퀴즈 없음, 비동기 생성 요청 트리거: userId={}", userId);
        fastApiService.requestQuizGenerationAsync(REQUEST_GENERATE_QUIZ_COUNT, "RANDOM", "RANDOM");

        throw new ResponseStatusException(HttpStatus.ACCEPTED, "퀴즈를 생성하고 있습니다");
    }

    /**
     * 미사용 퀴즈가 임계값 이하이면 백그라운드로 추가 생성 요청
     */
    private void triggerPreemptiveGeneration() {
        Integer unusedCount = cachedQuizRepository.countByIsUsed(false);
        if (unusedCount <= BUFFER_THRESHOLD) {
            log.info("캐싱 퀴즈 선제적 보충 트리거: 남은 미사용={}", unusedCount);
            fastApiService.requestQuizGenerationAsync(REQUEST_GENERATE_QUIZ_COUNT, "RANDOM", "RANDOM");
        }
    }

    /**
     * 퀴즈 답안 제출
     */
    public QuizSubmitResponse submitQuiz(Long userId, QuizSubmitRequest request) {
        LocalDate today = LocalDate.now();

        // 1. 오늘 맞춘 문제 수 조회
        Integer correctCount = historyRepository
                .countCorrectByUserIdAndQuizDate(userId, today);

        Integer currentSequence = correctCount;
        Integer nextSequence = correctCount + 1;

        // 2. 퀴즈 타입에 따라 분기
        boolean isCorrect;
        String correctAnswer;
        boolean addedToReviewNote = false;
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));

        if ("CACHED".equals(request.quizSource())) {
            // 101번 이후: CachedQuiz
            CachedQuiz cachedQuiz = cachedQuizRepository.findById(request.quizId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 퀴즈입니다"));

            isCorrect = checkCachedAnswer(cachedQuiz, request);
            correctAnswer = getCorrectAnswerStringFromCached(cachedQuiz);

            // 캐시드 퀴즈는 DailyQuizHistory에 저장하지 않음

        } else {
            // 1~100번: Quiz
            Quiz quiz = quizRepository.findById(request.quizId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 퀴즈입니다"));

            isCorrect = checkAnswer(quiz, request);
            correctAnswer = getCorrectAnswerString(quiz);

            // 오답노트 저장
            if (!isCorrect) {
                addedToReviewNote =
                        reviewNoteRepository.insertIfAbsent(userId, request.quizId()) == 1;
            }

            // DailyQuizHistory 저장 (100번 이하만)
            DailyQuizHistory history = new DailyQuizHistory(
                    userId,
                    quiz.getQuizId(),
                    isCorrect ? nextSequence : currentSequence,
                    isCorrect);
            historyRepository.save(history);
        }

        // 3. 보상 계산 (100번 이하만)
        Integer rewardAmount = 0;
        if (isCorrect && nextSequence <= DAILY_QUIZ_LIMIT) {
            rewardAmount = calculateRewardAmount(nextSequence);
            user.addBalance(rewardAmount.longValue());
            userRepository.save(user);
        }

        // 4. 오늘 퀴즈 보상 체크 (100번 완료 시)
        if (isCorrect && nextSequence == DAILY_QUIZ_LIMIT) {
            boolean alreadyReceived = rewardRepository
                    .existsByUserIdAndQuizRewardDate(userId, today);

            if (!alreadyReceived) {
                DailyLearningReward reward = new DailyLearningReward(userId);
                rewardRepository.save(reward);
            }
        }

        // 5. 업적 체크 (100번 이하만)
        if (nextSequence <= DAILY_QUIZ_LIMIT) {
            checkQuizAchievements(userId, isCorrect ? nextSequence : currentSequence, isCorrect);
        }

        return new QuizSubmitResponse(
                isCorrect,
                correctAnswer,
                rewardAmount,
                addedToReviewNote,
                user.getBalance());
    }

    /**
     * 오늘 맞춘 문제 수
     */
    public QuizCountResponse

            getTodayQuizCount(Long userId) {
        LocalDate today = LocalDate.now();

        // 오늘 맞춘 문제 수 조회
        Integer correctCount = historyRepository
                .countCorrectByUserIdAndQuizDate(userId, today);

        return new QuizCountResponse(correctCount);
    }

    /**
     * 퀴즈 관련 업적 체크
     */
    private void checkQuizAchievements(Long userId, Integer quizSequence, boolean isCorrect) {
        // 1. 개근왕 (오늘 첫 퀴즈 풀이 = 출석 체크)
        if (quizSequence == 1) {
            Long attendanceCount = achievementRedisRepository.increment(userId, "attendance_count");
            achievementService.checkAndAwardAchievements(
                    userId,
                    attendanceCount,
                    AchievementIdCode.ATTENDANCE_KING);
        }

        // 2. 퀴즈에서 살아남기 (첫 퀴즈 풀이)
        if (quizSequence == 1) {
            achievementService.checkAndAwardAchievements(
                    userId,
                    1L,
                    AchievementIdCode.QUIZ_SURVIVOR);
        }

        // 3. 주린이 탈출 (학습 진행도 100% 달성 체크)
        if (isCorrect) {
            checkLearningCompletion(userId);
        }
    }

    /**
     * 학습 진행도 100% 달성 체크
     */
    private void checkLearningCompletion(Long userId) {
        try {
            var progress = progressService.getProgress(userId, null, false);

            // 전체 챕터가 모두 완료되었는지 확인
            if (progress.summary().completedChapters() == progress.summary().totalChapters()) {
                achievementService.checkAndAwardAchievements(
                        userId,
                        100L,
                        AchievementIdCode.NEWBIE_ESCAPE);
            }
        } catch (Exception e) {
            log.warn("학습 진행도 업적 체크 실패: userId={}", userId, e);
        }
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

    /**
     * CachedQuiz 정답 체크
     */
    private boolean checkCachedAnswer(CachedQuiz cachedQuiz, QuizSubmitRequest request) {
        if (cachedQuiz.getQuizType() == QuizType.OX) {
            Boolean userAnswer = request.getOxAnswerValue();
            if (userAnswer == null) {
                throw new IllegalArgumentException("OX 답안이 올바르지 않습니다");
            }
            return userAnswer.equals(cachedQuiz.getAnswerOx());

        } else {
            Long userChoiceId = request.getChoiceId();
            if (userChoiceId == null) {
                throw new IllegalArgumentException("객관식 답안이 올바르지 않습니다");
            }

            CachedQuizChoice userChoice = cachedQuizChoiceRepository.findById(userChoiceId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 선택지입니다"));

            return userChoice.getIsAnswer();
        }
    }

    /**
     * CachedQuiz 정답 문자열 반환
     */
    private String getCorrectAnswerStringFromCached(CachedQuiz cachedQuiz) {
        if (cachedQuiz.getQuizType() == QuizType.OX) {
            return cachedQuiz.getAnswerOx() ? "O" : "X";
        } else {
            List<CachedQuizChoice> choices = cachedQuizChoiceRepository
                    .findByCachedQuizId(cachedQuiz.getCachedQuizId());

            return choices.stream()
                    .filter(CachedQuizChoice::getIsAnswer)
                    .findFirst()
                    .map(choice -> String.valueOf(choice.getCachedChoiceId()))
                    .orElseThrow(() -> new IllegalStateException("정답이 설정되지 않은 퀴즈입니다"));
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
            Boolean isQuizRewardReceived) {
        List<QuizResponse.ChoiceInfo> choices = null;
        if (quiz.getQuizType() == QuizType.MCQ) {
            List<QuizChoice> quizChoices = quizChoiceRepository.findByQuizId(quiz.getQuizId());

            choices = quizChoices.stream()
                    .map(choice -> new QuizResponse.ChoiceInfo(
                            choice.getChoiceId(),
                            choice.getChoiceText(),
                            choice.getChoiceNo()))
                    .collect(Collectors.toList());
        }

        QuizResponse.QuizDetail quizDetail = new QuizResponse.QuizDetail(
                quiz.getQuizId(),
                quiz.getQuizType(),
                quiz.getQuizContent(),
                choices);

        return new QuizResponse(
                quizSequence,
                isQuizRewardReceived,
                quizDetail);
    }

    private QuizResponse convertCachedQuizToResponse(
            CachedQuiz cachedQuiz,
            Integer quizSequence) {
        List<QuizResponse.ChoiceInfo> choices = null;
        if (cachedQuiz.getQuizType() == QuizType.MCQ) {
            List<CachedQuizChoice> cachedChoices = cachedQuizChoiceRepository
                    .findByCachedQuizId(cachedQuiz.getCachedQuizId());

            choices = cachedChoices.stream()
                    .map(choice -> new QuizResponse.ChoiceInfo(
                            choice.getCachedChoiceId(),
                            choice.getChoiceText(),
                            choice.getChoiceNo()))
                    .collect(Collectors.toList());
        }

        QuizResponse.QuizDetail quizDetail = new QuizResponse.QuizDetail(
                cachedQuiz.getCachedQuizId(),
                cachedQuiz.getQuizType(),
                cachedQuiz.getQuizContent(),
                choices);

        return new QuizResponse(
                quizSequence,
                false,
                quizDetail);
    }

}