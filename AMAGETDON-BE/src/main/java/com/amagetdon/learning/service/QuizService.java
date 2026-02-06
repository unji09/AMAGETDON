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

            return convertCachedQuizToResponse(cachedQuiz, nextSequence);
        }

        // 2. 퀴즈 없음 → FastAPI 호출하여 생성
        log.info("FastAPI 퀴즈 생성 요청");
        // 2. 퀴즈 없음 → FastAPI 호출하여 생성
        log.info("FastAPI 퀴즈 생성 요청");
        fastApiService.requestQuizGeneration(1, "RANDOM", "RANDOM");

        // 3. 생성 요청 후 재조회 (polling 방식)
        // 3. 생성 요청 후 재조회 (polling 방식)
        int maxRetries = 5;
        int retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                Thread.sleep(1000); // 1초 대기
                Thread.sleep(1000); // 1초 대기
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("퀴즈 생성 중 오류가 발생했습니다", e);
                throw new RuntimeException("퀴즈 생성 중 오류가 발생했습니다", e);
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

        // 4. 최대 재시도 초과
        // 4. 최대 재시도 초과
        throw new RuntimeException("퀴즈 생성에 실패했습니다. 다시 시도해주세요");
    }

    /**
     * 퀴즈 답안 제출
     */
    public QuizSubmitResponse submitQuiz(Long userId, QuizSubmitRequest request) {
        LocalDate today = LocalDate.now();

        // 1. 오늘 맞춘 문제 수 조회 (변경: 푼 문제 수 → 맞춘 문제 수)
        Integer correctCount = historyRepository
                .countCorrectByUserIdAndQuizDate(userId, today);

        Integer currentSequence = correctCount;
        Integer nextSequence = correctCount + 1;

        // 2. 퀴즈 타입에 따라 분기
        boolean isCorrect;
        String correctAnswer;
        DailyQuizHistory history;

        if ("CACHED".equals(request.quizSource())) {
            // 101번 이후: CachedQuiz
            CachedQuiz cachedQuiz = cachedQuizRepository.findById(request.quizId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 퀴즈입니다"));

            isCorrect = checkCachedAnswer(cachedQuiz, request);
            correctAnswer = getCorrectAnswerStringFromCached(cachedQuiz);

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));

            history = new DailyQuizHistory(
                    userId,
                    cachedQuiz.getCachedQuizId(),
                    today,
                    isCorrect ? nextSequence : currentSequence,
                    isCorrect);

        } else {
            // 1~100번: Quiz
            Quiz quiz = quizRepository.findById(request.quizId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 퀴즈입니다"));

            isCorrect = checkAnswer(quiz, request);
            correctAnswer = getCorrectAnswerString(quiz);

            // 오답노트 저장 (100개 미만일 때만)
            boolean addedToReviewNote = false;
            if (!isCorrect && currentSequence < DAILY_QUIZ_LIMIT) {
                User user = userRepository.findById(userId)
                        .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));

                boolean exists = reviewNoteRepository.existsByUserIdAndQuizId(userId, request.quizId());
                if (!exists) {
                    ReviewNote reviewNote = new ReviewNote(user, quiz);
                    reviewNoteRepository.save(reviewNote);
                }
            }

            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));

            history = new DailyQuizHistory(
                    user,
                    quiz,
                    today,
                    isCorrect ? nextSequence : currentSequence,
                    isCorrect);
        }

        // 3. History 저장
        historyRepository.save(history);

        // 4. 보상 계산 (맞춘 문제가 1~100개일 때만)
        int rewardAmount = 0;
        if (isCorrect && nextSequence <= DAILY_QUIZ_LIMIT) {
            rewardAmount = calculateRewardAmount(nextSequence);
        }

        // 5. User 조회 및 보상 지급
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다"));

        if (rewardAmount > 0) {
            user.addBalance((long) rewardAmount);
        }

        // 6. 업적 체크
        checkQuizAchievements(userId, isCorrect ? nextSequence : currentSequence, isCorrect);

        return new QuizSubmitResponse(
                isCorrect,
                correctAnswer,
                rewardAmount,
                false, // 101번 이후는 오답노트 없음
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
                    AchievementIdCode.ATTENDANCE_KING);
        }

        // 2. 퀴즈에서 살아남기 (첫 퀴즈 풀이)
        if (quizSequence == 1) {
            achievementService.checkAndAwardAchievements(
                    userId,
                    1L,
                    AchievementIdCode.QUIZ_SURVIVOR);
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
            Boolean isQuizRewardReceived) {
        List<QuizResponse.ChoiceInfo> choices = null;
        if (quiz.getQuizType() == QuizType.MCQ) {
            List<QuizChoice> quizChoices = quizChoiceRepository.findByQuizId(quiz.getQuizId());

            choices = quizChoices.stream()
                    .map(choice -> new QuizResponse.ChoiceInfo(
                            choice.getChoiceId(),
                            choice.getChoiceText(),
                            choice.getChoiceNo()))
                            choice.getChoiceNo()))
                    .collect(Collectors.toList());
        }

        QuizResponse.QuizDetail quizDetail = new QuizResponse.QuizDetail(
                quiz.getQuizId(),
                quiz.getQuizType(),
                quiz.getQuizContent(),
                choices);
                choices);

        return new QuizResponse(
                quizSequence,
                isQuizRewardReceived,
                quizDetail);
                quizDetail);
    }

    private QuizResponse convertCachedQuizToResponse(
            CachedQuiz cachedQuiz,
            Integer quizSequence) {
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
                            choice.getChoiceNo()))
                    .collect(Collectors.toList());
        }

        QuizResponse.QuizDetail quizDetail = new QuizResponse.QuizDetail(
                cachedQuiz.getCachedQuizId(),
                cachedQuiz.getQuizType(),
                cachedQuiz.getQuizContent(),
                choices);
                choices);

        return new QuizResponse(
                quizSequence,
                false,
                quizDetail);
                quizDetail);
    }

}