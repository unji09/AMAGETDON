// com/amagetdon/learning/service/ReviewNoteService.java
package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.reviewnote.ReviewNoteDetail;
import com.amagetdon.learning.dto.reviewnote.ReviewNoteListResponse;
import com.amagetdon.learning.entity.Quiz;
import com.amagetdon.learning.entity.QuizChoice;
import com.amagetdon.learning.entity.QuizType;
import com.amagetdon.learning.entity.ReviewNote;
import com.amagetdon.learning.repository.ChapterRepository;
import com.amagetdon.learning.repository.DailyLearningRewardRepository;
import com.amagetdon.learning.repository.QuizChoiceRepository;
import com.amagetdon.learning.repository.ReviewNoteRepository;
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
     * 오답노트 삭제
     */
    public void deleteReviewNote(Long userId, Long reviewNoteId) {
        ReviewNote reviewNote = reviewNoteRepository.findById(reviewNoteId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 오답노트입니다"));

        if (!reviewNote.getUserId().equals(userId)) {
            throw new IllegalArgumentException("삭제 권한이 없습니다");
        }

        reviewNoteRepository.delete(reviewNote);
    }

    private ReviewNoteDetail convertToReviewNoteDetail(ReviewNote reviewNote) {
        Quiz quiz = reviewNote.getQuiz();

        List<ReviewNoteDetail.ChoiceInfo> choices = null;
        if (quiz.getQuizType() == QuizType.MCQ) {
            List<QuizChoice> quizChoices = quizChoiceRepository
                    .findByQuiz_QuizId(quiz.getQuizId());

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