package com.amagetdon.stock.dto.response;

import com.amagetdon.stock.dto.StockPriceDto;
import com.amagetdon.stock.entity.MarketType;
import com.amagetdon.stock.entity.Stock;

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
    public static StockDetailResponse from(Stock stock, StockPriceDto price) {
        return new StockDetailResponse(
                stock.getStockName(), stock.getMarketType(),
                stock.getSector().getSectorName(),
                stock.getPer(), stock.getPbr(), stock.getMarketCap(),
                price.currentPrice(), price.changeRate(),
                price.changeAmount(), price.volume()
        );
    }
}
