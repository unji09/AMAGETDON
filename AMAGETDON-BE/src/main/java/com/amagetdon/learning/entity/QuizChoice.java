package com.amagetdon.learning.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "quiz_choices")
@Getter
@NoArgsConstructor
public class QuizChoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "choice_id")
    private Long choiceId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Column(name = "choice_no", nullable = false)
    private Integer choiceNo;  // 선택지 번호 (1, 2, 3, 4)

    @Column(name = "choice_text", nullable = false, length = 255)
    private String choiceText;  // 선택지 내용

    @Column(name = "is_answer", nullable = false)
    private Boolean isAnswer;  // 정답 여부 (true면 정답)
}