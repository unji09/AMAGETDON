package com.amagetdon.trading.dto.response;

import java.util.List;

public record StockHoldingResponse(
        int page,
        int size,
        long totalElements,
        List<StockHoldingItemResponse> items
) {
}
