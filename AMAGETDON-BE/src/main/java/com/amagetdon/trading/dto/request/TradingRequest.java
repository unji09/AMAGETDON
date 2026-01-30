package com.amagetdon.trading.dto.request;

public record TradingRequest(
        String stockCode,
        Integer quantity
) {
}
