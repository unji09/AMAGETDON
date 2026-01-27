package com.amagetdon.trading.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class TransactionListResponse {
    private int page;
    private int size;
    private long totalElements;
    private List<TransactionItemResponse> items;
}
