package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.reviewnote.ReviewNoteSubmitRequest;
import com.amagetdon.learning.entity.*;
import com.amagetdon.learning.repository.*;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReviewNoteServiceTest {

    @InjectMocks
    private ReviewNoteService reviewNoteService;

    @Mock
    private ReviewNoteRepository reviewNoteRepository;
    @Mock
    private QuizChoiceRepository quizChoiceRepository;
    @Mock
    private DailyLearningRewardRepository rewardRepository;
    @Mock
    private ChapterRepository chapterRepository;
    @Mock
    private QuizRepository quizRepository;
    @Mock
    private UserRepository userRepository;

    @Test
    void correctAnswerDeletesAllDuplicatedReviewNotes() {
        Long userId = 1L;
        Long quizId = 10L;

        Quiz quiz = mock(Quiz.class);
        ReviewNote first = mock(ReviewNote.class);
        ReviewNote second = mock(ReviewNote.class);
        User user = User.builder()
                .userId(userId)
                .nickname("tester")
                .balance(3_000_000L)
                .build();

        List<ReviewNote> duplicatedNotes = List.of(first, second);

        when(quizRepository.findById(quizId))
                .thenReturn(Optional.of(quiz));
        when(quiz.getQuizType()).thenReturn(QuizType.OX);
        when(quiz.getAnswerOx()).thenReturn(true);
        when(reviewNoteRepository.findAllByUserAndQuiz(userId, quizId))
                .thenReturn(duplicatedNotes);
        when(userRepository.findById(userId))
                .thenReturn(Optional.of(user));
        when(rewardRepository.findByUserId(userId))
                .thenReturn(Optional.of(new DailyLearningReward(userId)));
        when(reviewNoteRepository.countByUserId(userId))
                .thenReturn(0);

        reviewNoteService.submitReviewNote(
                userId,
                new ReviewNoteSubmitRequest(quizId, "O")
        );

        verify(reviewNoteRepository).deleteAll(duplicatedNotes);
    }
}