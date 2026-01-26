package com.amagetdon.trading.dto.request;

import com.amagetdon.stock.entity.MarketType;

public record TradingRequest(
        String stockCode,
        Integer quantity,
        MarketType marketType,
        Integer price
) {
}
