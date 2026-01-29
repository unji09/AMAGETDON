package com.amagetdon.trading.dto.response;

import java.math.BigDecimal;
import java.math.RoundingMode;

public record AssetResponse(
        Long balance,
        Long stockAsset,
        Long totalAsset,
        BigDecimal totalProfitRate,
        Long totalProfitAmount
) {
    public static AssetResponse of(Long balance, Long stockAsset, Long totalInvestment) {
        Long totalAsset = balance + stockAsset;
        Long totalProfitAmount = stockAsset - totalInvestment;

        BigDecimal totalProfitRate = totalInvestment > 0
                ? BigDecimal.valueOf(totalProfitAmount)
                .divide(BigDecimal.valueOf(totalInvestment), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return new AssetResponse(
                balance,
                stockAsset,
                totalAsset,
                totalProfitRate,
                totalProfitAmount
        );
    }
}
