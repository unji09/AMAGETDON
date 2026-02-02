package com.amagetdon.learning.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.learning.dto.reviewnote.ReviewNoteDetail;
import com.amagetdon.learning.dto.reviewnote.ReviewNoteListResponse;
import com.amagetdon.learning.dto.reviewnote.ReviewNoteSubmitRequest;
import com.amagetdon.learning.dto.reviewnote.ReviewNoteSubmitResponse;
import com.amagetdon.learning.entity.*;
import com.amagetdon.learning.repository.*;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewNoteService {

    private final ReviewNoteRepository reviewNoteRepository;
    private final QuizChoiceRepository quizChoiceRepository;
    private final DailyLearningRewardRepository rewardRepository;
    private final ChapterRepository chapterRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;

    /**
     * 오답노트 목록 조회 (챕터별 필터링)
     */
    public ReviewNoteListResponse getReviewNotes(Long userId) {
        List<ReviewNote> reviewNotes = reviewNoteRepository.findByUserIdWithQuiz(userId);

        Boolean todayRewardReceived = rewardRepository
                .existsByUserIdAndReviewRewardDate(userId, LocalDate.now());

        Map<String, List<ReviewNoteDetail>> groupedByChapter = reviewNotes.stream()
                .collect(Collectors.groupingBy(
                        reviewNote -> getChapterTitle(reviewNote.getQuiz()),
                        Collectors.mapping(
                                this::convertToReviewNoteDetail,
                                Collectors.toList()
                        )
                ));

        return new ReviewNoteListResponse(
                todayRewardReceived,
                reviewNotes.size(),
                groupedByChapter
        );
    }

    /**
     * 오답노트 풀이 제출
     */
    public ReviewNoteSubmitResponse submitReviewNote(Long userId, ReviewNoteSubmitRequest request) {
        LocalDate today = LocalDate.now();

        // 1. 퀴즈 존재 여부
        Quiz quiz = quizRepository.findById(request.quizId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 퀴즈입니다"));

        // 2. 오답노트에 있는지 확인
        ReviewNote reviewNote = reviewNoteRepository
                .findByUserAndQuiz(userId, request.quizId())
                .orElseThrow(() -> new IllegalArgumentException("오답노트에 없는 문제입니다"));

        // 3. 정답 체크
        boolean isCorrect = checkAnswer(quiz, request);

        // 4. 정답이면 오답노트에서 삭제
        boolean deletedFromReviewNote = false;
        if (isCorrect) {
            reviewNoteRepository.delete(reviewNote);
            deletedFromReviewNote = true;
        }

        // 5. 오늘 첫 풀이 여부 확인 및 보상 지급
        Integer rewardAmount = 0;

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));


        DailyLearningReward reward = rewardRepository
                .findByUserId(userId)
                .orElse(null);

        boolean alreadyReceivedToday = (reward != null &&
                reward.getReviewRewardDate().equals(today));

        if (isCorrect && !alreadyReceivedToday) {
            rewardAmount = 50_000;


            user.addBalance((long) rewardAmount);
            userRepository.save(user);

            if (reward == null) {
                reward = new DailyLearningReward(userId);
            } else {
                reward.updateReviewRewardDate();
            }
            rewardRepository.save(reward);
        }

        // 6. 현재 잔액 계산 (임시)
        Long currentBalance = 3000000L + rewardAmount;

        // 7. 남은 오답노트 개수
        Integer remainingReviewNoteCount = reviewNoteRepository
                .countByUserId(userId);

        // 8. 정답 문자열 생성
        String correctAnswer = getCorrectAnswerString(quiz);

        return new ReviewNoteSubmitResponse(
                isCorrect,
                correctAnswer,
                deletedFromReviewNote,
                rewardAmount,
                currentBalance,
                remainingReviewNoteCount
        );
    }

    /**
     * 오답노트 삭제
     */
    public void deleteReviewNote(Long userId, Long reviewNoteId) {

        ReviewNote reviewNote = reviewNoteRepository.findById(reviewNoteId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.REVIEW_NOTE_NOT_FOUND.getMessage()));

        reviewNoteRepository.delete(reviewNote);
    }

    /**
     * 정답 체크 (OX / 객관식)
     * QuizService의 로직과 동일하게 구현
     */
    private boolean checkAnswer(Quiz quiz, ReviewNoteSubmitRequest request) {
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
     * 정답 문자열 생성 (OX: "O"/"X", MCQ: choiceId)
     * QuizService의 로직과 동일하게 구현
     */
    private String getCorrectAnswerString(Quiz quiz) {
        if (quiz.getQuizType() == QuizType.OX) {
            return quiz.getAnswerOx() ? "O" : "X";
        } else {
            List<QuizChoice> choices = quizChoiceRepository
                    .findByQuizId(quiz.getQuizId());

            return choices.stream()
                    .filter(QuizChoice::getIsAnswer)
                    .findFirst()
                    .map(choice -> String.valueOf(choice.getChoiceId()))
                    .orElseThrow(() -> new IllegalStateException("정답이 설정되지 않은 퀴즈입니다"));
        }
    }

    private ReviewNoteDetail convertToReviewNoteDetail(ReviewNote reviewNote) {
        Quiz quiz = reviewNote.getQuiz();

        List<ReviewNoteDetail.ChoiceInfo> choices = null;
        if (quiz.getQuizType() == QuizType.MCQ) {
            List<QuizChoice> quizChoices = quizChoiceRepository
                    .findByQuizId(quiz.getQuizId());

            choices = quizChoices.stream()
                    .map(choice -> new ReviewNoteDetail.ChoiceInfo(
                            choice.getChoiceId(),
                            choice.getChoiceText(),
                            choice.getChoiceNo()
                    ))
                    .collect(Collectors.toList());
        }

        return new ReviewNoteDetail(
                reviewNote.getReviewNoteId(),
                quiz.getQuizId(),
                quiz.getQuizType(),
                quiz.getQuizContent(),
                choices,
                reviewNote.getCreatedAt()
        );
    }

    private String getChapterTitle(Quiz quiz) {
        return chapterRepository.findById(quiz.getChapterId())
                .map(chapter -> chapter.getChapterTitle())
                .orElse("알 수 없는 챕터");
    }
}