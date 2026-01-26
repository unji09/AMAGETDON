package com.amagetdon.investment.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "stock")
@Getter
@NoArgsConstructor
public class Stock {
    @Id
    @Column(length = 20)
    private String stockCode;

    @Column(nullable = false, length = 100)
    private String stockName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MarketType marketType;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
