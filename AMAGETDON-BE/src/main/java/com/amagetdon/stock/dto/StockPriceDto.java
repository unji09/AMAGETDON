package com.amagetdon.stock.dto;

import com.amagetdon.stock.entity.StockPrice;

import java.math.BigDecimal;

public record StockPriceDto(
        String currentPrice,
        Integer volume,
        Long tradingValue,
        Integer changeAmount,
        BigDecimal changeRate
) {
    public static StockPriceDto from(StockPrice entity) {
        return new StockPriceDto(
                entity.getCurrentPrice(),
                entity.getVolume(),
                entity.getTradingValue(),
                entity.getChangeAmount(),
                entity.getChangeRate()
        );
    }
}
