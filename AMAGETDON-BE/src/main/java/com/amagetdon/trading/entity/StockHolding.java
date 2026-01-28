package com.amagetdon.trading.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_holdings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockHolding {
    @EmbeddedId
    private StockHoldingId id;

    @Column(nullable = false, length = 100)
    private String stockName;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal avgPrice;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Embeddable
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class StockHoldingId implements Serializable {
        private String stockCode;
        private Long userId;
    }
}
