package com.amagetdon.trading.dto.response;

import com.amagetdon.stock.entity.Stock;
import com.amagetdon.trading.entity.StockHolding;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
        public static StockHoldingItem from(StockHolding holding, Integer currentPrice) {
            Stock stock = holding.getStock();
            int quantity = holding.getQuantity();
            BigDecimal avgPrice = holding.getAvgPrice();

            long totalValue = calculateTotalValue(quantity, currentPrice);
            BigDecimal totalInvestment = calculateTotalInvestment(quantity, avgPrice);
            long profitAmount = calculateProfitAmount(totalValue, totalInvestment);
            BigDecimal profitRate = calculateProfitRate(profitAmount, totalInvestment);

            return new StockHoldingItem(
                    stock.getStockCode(),
                    stock.getStockName(),
                    quantity,
                    avgPrice,
                    currentPrice,
                    totalValue,
                    profitAmount,
                    profitRate
            );
        }

        private static long calculateTotalValue(int quantity, int currentPrice) {
            return (long) quantity * currentPrice;
        }

        private static BigDecimal calculateTotalInvestment(int quantity, BigDecimal avgPrice) {
            return avgPrice.multiply(BigDecimal.valueOf(quantity));
        }

        private static long calculateProfitAmount(long totalValue, BigDecimal totalInvestment) {
            return totalValue - totalInvestment.longValue();
        }

        private static BigDecimal calculateProfitRate(long profitAmount, BigDecimal totalInvestment) {
            return BigDecimal.valueOf(profitAmount)
                    .divide(totalInvestment, 4, RoundingMode.HALF_UP);
        }
    }
}
