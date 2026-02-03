package com.amagetdon.watchlist.service;

import com.amagetdon.achievement.service.AchievementService;
import com.amagetdon.stock.entity.Stock;
import com.amagetdon.stock.entity.StockPrice;
import com.amagetdon.stock.repository.StockPriceRepository;
import com.amagetdon.stock.repository.StockRepository;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import com.amagetdon.watchlist.dto.response.WatchlistResponse;
import com.amagetdon.watchlist.dto.response.WatchlistResponse.WatchlistItem;
import com.amagetdon.watchlist.entity.Watchlist;
import com.amagetdon.watchlist.repository.WatchlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;

import static com.amagetdon.achievement.entity.AchievementIdCode.DIVERSIFY_EGGS;
import static com.amagetdon.common.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final StockPriceRepository stockPriceRepository;
    private final AchievementService achievementService;

    public WatchlistResponse getWatchlist(Long userId, Pageable pageable) {
        Page<Watchlist> watchlistPage = watchlistRepository.findByUserUserId(userId, pageable);
        List<WatchlistItem> items = convertToItems(watchlistPage.getContent());

        return WatchlistResponse.from(watchlistPage, items);
    }

    @Transactional
    public void addToWatchlist(Long userId, String stockCode) {
        validateStockCode(stockCode);

        if (watchlistRepository.existsByUserUserIdAndStockStockCode(userId, stockCode)) {
            throw new IllegalArgumentException(WATCHLIST_ALREADY_EXISTS.getMessage());
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(USER_NOT_FOUND_SIMPLE.getMessage()));

        Stock stock = stockRepository.findById(stockCode)
                .orElseThrow(() -> new IllegalArgumentException(STOCK_NOT_FOUND.getMessage()));

        Watchlist watchlist = Watchlist.builder()
                .user(user)
                .stock(stock)
                .build();

        watchlistRepository.save(watchlist);

        long watchlistCount = watchlistRepository.countByUserUserId(userId);
        achievementService.checkAndAwardAchievements(userId, watchlistCount, DIVERSIFY_EGGS);
    }

    @Transactional
    public void removeFromWatchlist(Long userId, Long watchlistId) {
        Watchlist watchlist = watchlistRepository.findById(watchlistId)
                .orElseThrow(() -> new IllegalArgumentException(WATCHLIST_NOT_FOUND.getMessage()));

        if (!watchlist.getUser().getUserId().equals(userId)) {
            throw new IllegalArgumentException(WATCHLIST_ACCESS_DENIED.getMessage());
        }

        watchlistRepository.delete(watchlist);
    }

    private List<WatchlistItem> convertToItems(List<Watchlist> watchlists) {
        return watchlists.stream()
                .map(this::convertToItem)
                .toList();
    }

    private WatchlistItem convertToItem(Watchlist watchlist) {
        StockPrice latestPrice = getCurrentPrice(watchlist.getStock());
        Integer currentPrice = Integer.parseInt(latestPrice.getCurrentPrice());
        BigDecimal changeRate = latestPrice.getChangeRate();

        return WatchlistItem.from(watchlist, currentPrice, changeRate);
    }

    private StockPrice getCurrentPrice(Stock stock) {
        return stockPriceRepository
                .findTopByStockOrderByCreatedAtDesc(stock)
                .orElseThrow(() -> new IllegalStateException(PRICE_NOT_AVAILABLE.getMessage()));
    }

    private void validateStockCode(String stockCode) {
        if (!StringUtils.hasText(stockCode)) {
            throw new IllegalArgumentException(INVALID_INPUT.getMessage());
        }

        if (!stockCode.matches("\\d{6}")) {
            throw new IllegalArgumentException(INVALID_STOCK_CODE_FORMAT.getMessage());
        }
    }
}
