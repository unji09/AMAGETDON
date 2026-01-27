package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.quiz.QuizResponse;
import com.amagetdon.learning.dto.quiz.QuizSubmitRequest;
import com.amagetdon.learning.dto.quiz.QuizSubmitResponse;
import com.amagetdon.learning.entity.*;
import com.amagetdon.learning.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizChoiceRepository quizChoiceRepository;
    private final DailyQuizHistoryRepository historyRepository;
    private final ReviewNoteRepository reviewNoteRepository;
    private final DailyLearningRewardRepository rewardRepository;

    /**
     * 오늘의 퀴즈 1개 조회
     */
    public QuizResponse getDailyQuiz(Long userId) {
        LocalDate today = LocalDate.now();

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

        // 6. 현재 sequence 계산
        Integer currentSequence = historyRepository
                .findMaxSequenceByUserIdAndQuizDate(userId, today);
        Integer nextSequence = (currentSequence == null) ? 1 : currentSequence + 1;

        // 7. 오늘 퀴즈 보상 받았는지 확인
        Boolean isQuizRewardReceived = rewardRepository
                .existsByUserIdAndQuizRewardDate(userId, today);

        // 8. DTO 변환
        return convertToQuizResponse(quiz, nextSequence, isQuizRewardReceived);
    }

    /**
     * 퀴즈 답안 제출
     */
    public QuizSubmitResponse submitQuiz(Long userId, QuizSubmitRequest request) {
        LocalDate today = LocalDate.now();

        // 1. 검증: 퀴즈 존재 여부
        Quiz quiz = quizRepository.findById(request.quizId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 퀴즈입니다"));

        // 2. 검증: 중복 제출 방지
        boolean alreadySolved = historyRepository
                .existsByUserIdAndQuizIdAndQuizDate(userId, request.quizId(), today);
        if (alreadySolved) {
            throw new IllegalStateException("이미 푼 문제입니다");
        }

        // 3. 정답 체크
        boolean isCorrect = checkAnswer(quiz, request);

        // 4. 히스토리 저장
        DailyQuizHistory history = new DailyQuizHistory(
                userId,
                request.quizId(),
                request.quizSequence(),
                isCorrect
        );
        historyRepository.save(history);

        // 5. 틀렸으면 오답노트 저장
        boolean addedToReviewNote = false;
        if (!isCorrect) {
            boolean alreadyInReviewNote = reviewNoteRepository
                    .existsByUserIdAndQuiz_QuizId(userId, request.quizId());

            if (!alreadyInReviewNote) {
                ReviewNote reviewNote = new ReviewNote(userId, quiz);
                reviewNoteRepository.save(reviewNote);
                addedToReviewNote = true;
            }
        }

        // 6. 보상 지급
        Integer rewardAmount = calculateRewardAmount(request.quizSequence());

        // TODO(민규): User balance 업데이트
         Long currentBalance = 3000000L + rewardAmount;

        // 7. 정답 문자열 생성
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
        if (quizSequence < 1 || quizSequence > 100) {
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
            List<QuizChoice> choices = quizChoiceRepository
                    .findByQuiz_QuizId(quiz.getQuizId());

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
            List<QuizChoice> quizChoices = quizChoiceRepository
                    .findByQuiz_QuizId(quiz.getQuizId());

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
}