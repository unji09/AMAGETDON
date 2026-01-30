package com.amagetdon.trading.entity;

import com.amagetdon.stock.entity.Stock;
import com.amagetdon.user.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_holdings")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockHolding {
    @EmbeddedId
    private StockHoldingId stockHoldingId;

    @MapsId("userId")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @MapsId("stockCode")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_code", nullable = false)
    private Stock stock;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false, precision = 15, scale = 2)
    private BigDecimal avgPrice;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public void addQuantity(Integer quantity, BigDecimal newAvgPrice) {
        this.quantity += quantity;
        this.avgPrice = newAvgPrice;
        this.updatedAt = LocalDateTime.now();
    }

    public void subtractQuantity(Integer quantity) {
        if (this.quantity < quantity) {
            throw new IllegalArgumentException("보유 수량이 부족합니다.");
        }
        this.quantity -= quantity;
        this.updatedAt = LocalDateTime.now();
    }

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
