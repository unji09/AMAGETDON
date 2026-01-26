package com.amagetdon.transaction.dto.mapper;

import com.amagetdon.transaction.dto.response.TransactionItemResponse;
import com.amagetdon.transaction.entity.Transaction;

public class TransactionMapper {
    public static TransactionItemResponse toResponse(Transaction transaction) {
        return new TransactionItemResponse(
                transaction.getTransactionId(),
                transaction.getStockCode(),
                transaction.getStockName(),
                transaction.getTransactionType().description,
                transaction.getQuantity(),
                transaction.getPrice(),
                transaction.getTotalAmount(),
                transaction.getCreatedAt(),
                transaction.getFeeAmount()
        );
    }
}
