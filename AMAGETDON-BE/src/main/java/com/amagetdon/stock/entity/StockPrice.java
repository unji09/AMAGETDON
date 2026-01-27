package com.amagetdon.stock.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_prices")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockPrice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long priceId;

    @ManyToOne
    @JoinColumn(name = "stock_code")
    private Stock stock;

    @Column(nullable = false, length = 20)
    private String currentPrice;

    @Column(nullable = false)
    private Integer volume;

    @Column(nullable = false)
    private Long tradingValue;

    @Column(nullable = false)
    private Integer changeAmount;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal changeRate;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
