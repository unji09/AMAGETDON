package com.amagetdon.stock.dto.response;

import com.amagetdon.stock.entity.MarketType;

import java.math.BigDecimal;

public record StockDetailResponse(
        String stockName,
        MarketType marketType,
        String sectorName,
        BigDecimal per,
        BigDecimal pbr,
        Long marketCap,
        String currentPrice,
        BigDecimal changeRate,
        Integer changeAmount,
        Integer volume
) {
}
