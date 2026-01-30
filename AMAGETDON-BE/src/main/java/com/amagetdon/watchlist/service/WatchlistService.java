package com.amagetdon.watchlist.service;

import com.amagetdon.stock.entity.Stock;
import com.amagetdon.watchlist.dto.response.WatchlistResponse;
import com.amagetdon.watchlist.entity.Watchlist;
import com.amagetdon.watchlist.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;

    public WatchlistResponse getWatchlist(Long userId, Pageable pageable) {
        Page<Watchlist> watchlistPage = watchlistRepository.findByUserUserId(userId, pageable);
        Page<Stock> stockPage = watchlistPage.map(Watchlist::getStock);
        return WatchlistResponse.from(stockPage);
    }
}