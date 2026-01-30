package com.amagetdon.learning.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "cached_quizzes")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor
public class CachedQuiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cached_quiz_id")
    private Long cachedQuizId;

    @Enumerated(EnumType.STRING)
    @Column(name = "quiz_type", nullable = false)
    private QuizType quizType;

    @Column(name = "quiz_content", nullable = false, columnDefinition = "TEXT")
    private String quizContent;

    @Column(name = "answer_ox")
    private Boolean answerOx;

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false)
    private Difficulty difficulty;

    @Column(name = "hint", columnDefinition = "TEXT")
    private String hint;

    @Column(name = "explanation_text", columnDefinition = "TEXT")
    private String explanationText;

    @Column(name = "is_used", nullable = false)
    private Boolean isUsed = false;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    // 사용 처리
    public void markAsUsed() {
        this.isUsed = true;
    }

    // 생성자 (FastAPI에서 저장 시 사용)
    public CachedQuiz(
            QuizType quizType,
            String quizContent,
            Boolean answerOx,
            Difficulty difficulty,
            String hint,
            String explanationText
    ) {
        this.quizType = quizType;
        this.quizContent = quizContent;
        this.answerOx = answerOx;
        this.difficulty = difficulty;
        this.hint = hint;
        this.explanationText = explanationText;
        this.isUsed = false;
    }
}