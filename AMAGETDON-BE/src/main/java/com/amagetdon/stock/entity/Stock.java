package com.amagetdon.stock.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StockStatus stockStatus = StockStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_code")
    private Sector sector;

    @Column(precision = 10, scale = 2)
    private BigDecimal per;

    @Column(precision = 10, scale = 2)
    private BigDecimal pbr;

    private Integer eps;

    private Integer bps;

    private Long marketCap;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

}
