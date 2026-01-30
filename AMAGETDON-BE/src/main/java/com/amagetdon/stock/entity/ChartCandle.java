package com.amagetdon.stock.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chart_candles")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
public class ChartCandle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long candleId;

    @ManyToOne
    @JoinColumn(name = "stock_code")
    private Stock stockCode;

    @Column(nullable = false, length = 10)
    private IntervalType intervalType;

    @Column(nullable = false)
    private LocalDateTime candleTime;

    @Column(nullable = false)
    private Integer openPrice;

    @Column(nullable = false)
    private Integer highPrice;

    @Column(nullable = false)
    private Integer lowPrice;

    @Column(nullable = false)
    private Integer closePrice;

    @Column(nullable = false)
    private Long volume;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
