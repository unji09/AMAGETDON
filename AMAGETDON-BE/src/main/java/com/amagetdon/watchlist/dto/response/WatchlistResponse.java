package com.amagetdon.watchlist.dto.response;

import com.amagetdon.stock.entity.MarketType;
import com.amagetdon.stock.entity.Stock;
import com.amagetdon.watchlist.entity.Watchlist;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

public record WatchlistResponse(
        int currentPage,
        int totalPages,
        long totalElements,
        int size,
        List<WatchlistStockItem> stocks
) {
    public static WatchlistResponse from(Page<Watchlist> page) {
        List<WatchlistStockItem> stocks = page.getContent().stream()
                .map(WatchlistStockItem::from)
                .toList();

        return new WatchlistResponse(
                page.getNumber(),
                page.getTotalPages(),
                page.getTotalElements(),
                page.getSize(),
                stocks
        );
    }

    public record WatchlistStockItem(
            String stockCode,
            String stockName,
            MarketType marketType,
            LocalDateTime createdAt
    ) {
        public static WatchlistStockItem from(Watchlist watchlist) {
            Stock stock = watchlist.getStock();
            return new WatchlistStockItem(
                    stock.getStockCode(),
                    stock.getStockName(),
                    stock.getMarketType(),
                    watchlist.getCreatedAt()
            );
        }
    }
}
