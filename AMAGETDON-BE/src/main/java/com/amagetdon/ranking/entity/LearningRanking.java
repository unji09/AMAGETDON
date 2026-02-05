package com.amagetdon.ranking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "learning_rankings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LearningRanking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ranking_id")
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(name = "ranking", nullable = false)
    private Integer rank;

    @Column(nullable = false)
    private Integer totalCorrect;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
