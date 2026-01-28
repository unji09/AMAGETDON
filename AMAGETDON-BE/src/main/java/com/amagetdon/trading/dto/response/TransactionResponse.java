package com.amagetdon.trading.dto.response;

import com.amagetdon.trading.entity.Transaction;

import java.time.LocalDateTime;
import java.util.List;

public record TransactionResponse(
        int page,
        int size,
        long totalElements,
        List<TransactionItem> items
) {
    public record TransactionItem(
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
        public static TransactionItem from(Transaction transaction) {
            return new TransactionItem(
                    transaction.getTransactionId(),
                    transaction.getStock().getStockCode(),
                    transaction.getStock().getStockName(),
                    transaction.getTransactionType().name(),
                    transaction.getQuantity(),
                    transaction.getPrice(),
                    transaction.getTotalAmount(),
                    transaction.getCreatedAt(),
                    transaction.getFeeAmount()
            );
        }
    }
}
