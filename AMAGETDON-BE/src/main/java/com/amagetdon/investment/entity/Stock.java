package com.amagetdon.investment.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "stock")
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Stock {
    @Id
    @Column(name = "stock_code", length = 20)
    private String stockCode;

    @Column(name = "stock_name", length = 100)
    private String stockName;

    @Enumerated(EnumType.STRING)
    @Column(name = "market_type")
    private MarketType marketType;

    @Column(name = "created_at")
    private LocalDate createdAt;
}
