package com.amagetdon.transaction.dto.response;

import com.amagetdon.transaction.entity.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class TransactionItemResponse {
    private Long transactionId;
    private String stockCode;
    private String stockName;
    private String transactionType;
    private Integer quantity;
    private Integer price;
    private Long totalAmount;
    private LocalDateTime createdAt;
    private Integer feeAmount;
}
