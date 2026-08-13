package com.amagetdon.stock.dto.response;

import com.amagetdon.stock.dto.StockPriceDto;
import com.amagetdon.stock.entity.Stock;

import java.math.BigDecimal;

public record VolumeRankingResponse(
        Integer rank,
        String stockCode,
        String stockName,
        String currentPrice,
        BigDecimal changeRate,
        Integer volume
) {
    public static VolumeRankingResponse from(int rank, Stock stock, StockPriceDto price) {
        return new VolumeRankingResponse(
                rank, stock.getStockCode(), stock.getStockName(),
                price.currentPrice(), price.changeRate(), price.volume()
        );
    }
}
