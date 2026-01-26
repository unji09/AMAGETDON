package com.amagetdon.trading.dto.response;

import com.amagetdon.trading.entity.Transaction;

import java.time.LocalDateTime;

public record TransactionItemResponse(
        Long transactionId,
        String stockCode,
        String stockName,
        String transactionType,
        Integer quantity,
        Integer price,
        Long totalAmount,
        LocalDateTime createdAt,
        Integer feeAmount
) {
    public static TransactionItemResponse from(Transaction transaction) {
        return new TransactionItemResponse(
                transaction.getTransactionId(),
                transaction.getStockCode(),
                transaction.getStockName(),
                transaction.getTransactionType().name(),
                transaction.getQuantity(),
                transaction.getPrice(),
                transaction.getTotalAmount(),
                transaction.getCreatedAt(),
                transaction.getFeeAmount()
        );
    }
}
