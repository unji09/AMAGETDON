package com.amagetdon.stock.dto.response;

import java.math.BigDecimal;

public record VolumeRankingResponse(
        Integer rank,
        String stockCode,
        String stockName,
        String currentPrice,
        BigDecimal changeRate,
        Integer volume
) {
}
