package com.amagetdon.ranking.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "profit_rankings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ProfitRanking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ranking_id")
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false)
    private Integer rank;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal totalProfit;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
