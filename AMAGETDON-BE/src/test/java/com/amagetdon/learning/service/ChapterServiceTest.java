package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.chapter.QuizSubmissionRequest;
import com.amagetdon.learning.entity.Chapter;
import com.amagetdon.learning.entity.Quiz;
import com.amagetdon.learning.entity.QuizType;
import com.amagetdon.learning.repository.ChapterRepository;
import com.amagetdon.learning.repository.QuizChoiceRepository;
import com.amagetdon.learning.repository.QuizRepository;
import com.amagetdon.learning.repository.ReviewNoteRepository;
import com.amagetdon.learning.repository.UserChapterProgressRepository;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ChapterServiceTest {

    @InjectMocks
    private ChapterService chapterService;

    @Mock
    private ChapterRepository chapterRepository;

    @Mock
    private UserChapterProgressRepository progressRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private QuizRepository quizRepository;

    @Mock
    private QuizChoiceRepository quizChoiceRepository;

    @Mock
    private ReviewNoteRepository reviewNoteRepository;

    @Test
    @DisplayName("이미 오답노트에 저장된 문제는 다시 틀려도 중복 저장하지 않는다")
    void doesNotSaveAlreadyExistingReviewNote() {
        // given
        Long userId = 1L;
        Long chapterId = 100L;
        Long quizId = 10L;

        User user = mock(User.class);
        Chapter chapter = mock(Chapter.class);
        Quiz quiz = mock(Quiz.class);

        QuizSubmissionRequest request = new QuizSubmissionRequest(
                List.of(new QuizSubmissionRequest.AnswerItem(quizId, "X"))
        );

        when(userRepository.findById(userId))
                .thenReturn(Optional.of(user));
        when(chapterRepository.findById(chapterId))
                .thenReturn(Optional.of(chapter));
        when(quizRepository.findAllById(List.of(quizId)))
                .thenReturn(List.of(quiz));

        when(quiz.getQuizId()).thenReturn(quizId);
        when(quiz.getQuizType()).thenReturn(QuizType.OX);
        when(quiz.getAnswerOx()).thenReturn(true);

        when(quizChoiceRepository.findAllById(List.<Long>of()))
                .thenReturn(List.of());
        when(reviewNoteRepository.insertIfAbsent(userId, quizId))
                .thenReturn(0);

        when(user.getBalance()).thenReturn(3_000_000L);

        // when
        chapterService.submitQuizAnswers(userId, chapterId, request);

        // then
        verify(reviewNoteRepository)
                .insertIfAbsent(userId, quizId);
        verify(reviewNoteRepository, never())
                .saveAll(anyList());
    }
}