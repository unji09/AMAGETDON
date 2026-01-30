package com.amagetdon.watchlist.dto.response;

import com.amagetdon.stock.entity.MarketType;
import com.amagetdon.stock.entity.Stock;
import org.springframework.data.domain.Page;

import java.util.List;

public record WatchlistResponse(
        int currentPage,
        int totalPages,
        long totalElements,
        int size,
        List<WatchlistStockItem> stocks
) {
    public static WatchlistResponse from(Page<Stock> page) {
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
            MarketType marketType
    ) {
        public static WatchlistStockItem from(Stock stock) {
            return new WatchlistStockItem(
                    stock.getStockCode(),
                    stock.getStockName(),
                    stock.getMarketType()
            );
        }
    }
}
