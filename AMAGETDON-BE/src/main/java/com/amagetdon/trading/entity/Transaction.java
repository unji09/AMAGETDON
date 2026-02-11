package com.amagetdon.trading.entity;

import com.amagetdon.stock.entity.Stock;
import com.amagetdon.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

@Entity
@Table(name = "transaction")
@EntityListeners(AuditingEntityListener.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Transaction {
    private static final BigDecimal BUY_FEE_RATE = new BigDecimal("0.00015");
    private static final BigDecimal SELL_FEE_RATE = new BigDecimal("0.0015");
    private static final int MINIMUM_FEE = 1;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "stock_code", nullable = false)
    private Stock stock;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransactionType transactionType;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer price;

    @Column(nullable = false)
    private Long totalAmount;

    @Column(nullable = false)
    private Integer feeAmount;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public static Transaction of(
            User user,
            Stock stock,
            Integer quantity,
            Integer price,
            TransactionType transactionType
    ) {
        Transaction transaction = new Transaction();

        transaction.user = user;
        transaction.stock = stock;
        transaction.transactionType = transactionType;
        transaction.quantity = quantity;
        transaction.price = price;
        transaction.totalAmount = (long) quantity * price;
        transaction.feeAmount = calculateFee(transactionType, transaction.totalAmount);
        return transaction;
    }

    private static Integer calculateFee(TransactionType transactionType, Long amount) {
        BigDecimal feeRate = (transactionType == TransactionType.SELL) ? SELL_FEE_RATE : BUY_FEE_RATE;

        BigDecimal calculatedFee = new BigDecimal(amount)
                .multiply(feeRate)
                .setScale(0, RoundingMode.CEILING);

        int fee = calculatedFee.intValue();
        return Math.max(fee, MINIMUM_FEE);
    }

    public Long getNetAmount() {
        if (transactionType == TransactionType.SELL) {
            return totalAmount - feeAmount;
        }
        return totalAmount + feeAmount;
    }
}
