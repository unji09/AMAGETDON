package com.amagetdon.trading.dto.response;

import com.amagetdon.trading.entity.Transaction;
import com.amagetdon.trading.entity.TransactionType;

import java.time.LocalDateTime;

public record TradingResponse(
        Long transactionId,
        String stockCode,
        String stockName,
        TransactionType transactionType,
        Integer quantity,
        Integer price,
        Long totalAmount,
        Integer feeAmount,
        Long netAmount,
        Long remainingBalance,
        LocalDateTime tradedAt
) {
    public static TradingResponse of(Transaction transaction, Long remainingBalance) {
        return new TradingResponse(
                transaction.getTransactionId(),
                transaction.getStock().getStockCode(),
                transaction.getStock().getStockName(),
                transaction.getTransactionType(),
                transaction.getQuantity(),
                transaction.getPrice(),
                transaction.getTotalAmount(),
                transaction.getFeeAmount(),
                transaction.getNetAmount(),
                remainingBalance,
                transaction.getCreatedAt()
        );
    }
}
