package com.amagetdon.trading.service;

import com.amagetdon.stock.dto.StockPriceDto;
import com.amagetdon.stock.repository.StockRepository;
import com.amagetdon.stock.service.StockPriceCacheService;
import com.amagetdon.trading.dto.response.StockHoldingItemResponse;
import com.amagetdon.trading.dto.response.StockHoldingResponse;
import com.amagetdon.trading.entity.StockHolding;
import com.amagetdon.trading.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static com.amagetdon.common.ErrorCode.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockHoldingService {
    private final AccountRepository accountRepository;
    private final StockRepository stockRepository;
    private final StockPriceCacheService stockPriceCacheService;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String USER_STOCKS_KEY = "kis:user_stocks";

    public StockHoldingResponse getStockHoldings(Long userId, Pageable pageable) {
        Page<StockHolding> holdingsPage = accountRepository.findByStockHoldingIdUserId(userId, pageable);
        List<StockHoldingItemResponse> items = convertToItems(holdingsPage.getContent());

        holdingsPage.getContent().forEach(holding -> {
            String stockCode = holding.getStockHoldingId().getStockCode();
            redisTemplate.opsForValue().set(
                    USER_STOCKS_KEY + ":" + stockCode,
                    stockCode,
                    10,
                    TimeUnit.SECONDS
            );
        });

        return new StockHoldingResponse(
                holdingsPage.getNumber(),
                holdingsPage.getSize(),
                holdingsPage.getTotalElements(),
                items
        );
    }

    public StockHoldingItemResponse getSingleStockHolding(Long userId, String stockCode) {
        validateStockCode(stockCode);

        StockHolding holding = accountRepository
                .findByStockHoldingIdUserIdAndStockHoldingIdStockCode(userId, stockCode)
                .orElseThrow(() -> new IllegalArgumentException(NO_OWNED_STOCK.getMessage()));

        return convertToItem(holding);
    }

    private List<StockHoldingItemResponse> convertToItems(List<StockHolding> holdings) {
        return holdings.stream()
                .map(this::convertToItem)
                .toList();
    }

    private StockHoldingItemResponse convertToItem(StockHolding holding) {
        StockPriceDto priceData = stockPriceCacheService
                .getLatestPrice(holding.getStock())
                .orElseThrow(() -> new IllegalStateException(PRICE_NOT_AVAILABLE.getMessage()));
        Integer currentPrice = Integer.parseInt(priceData.currentPrice());
        BigDecimal changeRate = priceData.changeRate();

        return StockHoldingItemResponse.from(holding, currentPrice, changeRate);
    }

    private void validateStockCode(String stockCode) {
        if (!StringUtils.hasText(stockCode)) {
            throw new IllegalArgumentException(INVALID_INPUT.getMessage());
        }

        if (!stockCode.matches("^[A-Za-z0-9]{6}$")) {
            throw new IllegalArgumentException(INVALID_STOCK_CODE_FORMAT.getMessage());
        }

        stockRepository.findById(stockCode)
                .orElseThrow(() -> new IllegalArgumentException(STOCK_INFO_NOT_FOUND.getMessage()));
    }
}
