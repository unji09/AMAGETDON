package com.amagetdon.trading.entity;

import com.amagetdon.stock.entity.Stock;
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
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class StockHolding {
    @EmbeddedId
    private StockHoldingId stockHoldingId;

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
