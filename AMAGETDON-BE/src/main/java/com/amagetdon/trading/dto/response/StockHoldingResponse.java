package com.amagetdon.trading.dto.response;

import java.math.BigDecimal;
import java.util.List;

public record StockHoldingResponse(
        int page,
        int size,
        long totalElements,
        List<StockHoldingItem> items
) {
    public record StockHoldingItem(
            String stockCode,
            String stockName,
            Integer quantity,
            BigDecimal avgPrice,
            Integer currentPrice,
            Long totalValue,
            Long profitAmount,
            BigDecimal profitRate
    ) {
    }
}
