package com.amagetdon.watchlist.dto.response;

import com.amagetdon.stock.entity.Stock;
import com.amagetdon.watchlist.entity.Watchlist;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record WatchlistResponse(
        int page,
        int size,
        long totalElements,
        List<WatchlistItem> items
) {
    public static WatchlistResponse from(Page<Watchlist> watchlistPage, List<WatchlistItem> items) {
        return new WatchlistResponse(
                watchlistPage.getNumber(),
                watchlistPage.getSize(),
                watchlistPage.getTotalElements(),
                items
        );
    }

    public record WatchlistItem(
            Long watchlistId,
            String stockCode,
            String stockName,
            String marketType,
            Integer currentPrice,
            BigDecimal changeRate,
            LocalDateTime createdAt
    ) {
        public static WatchlistItem from(Watchlist watchlist, Integer currentPrice, BigDecimal changeRate) {
            Stock stock = watchlist.getStock();

            return new WatchlistItem(
                    watchlist.getWatchlistId(),
                    stock.getStockCode(),
                    stock.getStockName(),
                    stock.getMarketType().name(),
                    currentPrice,
                    changeRate,
                    watchlist.getCreatedAt()
            );
        }
    }
}
