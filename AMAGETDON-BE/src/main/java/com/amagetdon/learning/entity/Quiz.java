package com.amagetdon.learning.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "quizzes")
@Getter
@NoArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "quiz_id")
    private Long quizId;

    @Column(name = "chapter_id", nullable = false)
    private Long chapterId;

    @Enumerated(EnumType.STRING)
    @Column(name = "quiz_type", nullable = false)
    private QuizType quizType;

    @Column(name = "quiz_title", nullable = false, length = 120)
    private String quizTitle;

    @Column(name = "quiz_content", nullable = false, columnDefinition = "TEXT")
    private String quizContent;

    @Column(name = "answer_ox")
    private Boolean answerOx;  // OX 문제의 정답 (O면 true, X면 false)

    @Enumerated(EnumType.STRING)
    @Column(name = "difficulty", nullable = false)
    private Difficulty difficulty;

    @Column(name = "hint", columnDefinition = "TEXT")
    private String hint;

    @Column(name = "explanation_text", columnDefinition = "TEXT")
    private String explanationText;


    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}