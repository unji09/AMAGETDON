package com.amagetdon.stock.service;

import com.amagetdon.stock.dto.StockPriceDto;
import com.amagetdon.stock.entity.Stock;
import com.amagetdon.stock.repository.StockPriceRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockPriceCacheService {

    private final RedisTemplate<String, String> redisTemplate;
    private final StockPriceRepository stockPriceRepository;
    private final ObjectMapper objectMapper;

    private static final String STOCK_PRICE_KEY = "stock:price:";
    private static final LocalTime MARKET_OPEN = LocalTime.of(9, 0);
    private static final LocalTime MARKET_CLOSE = LocalTime.of(15, 30);
    private static final int POLL_INTERVAL_MS = 500;
    private static final int POLL_TIMEOUT_MS = 6000;

    public Optional<StockPriceDto> getLatestPrice(String stockCode) {
        Optional<StockPriceDto> cached = getFromRedis(stockCode);
        if (cached.isPresent()) {
            return cached;
        }

        return stockPriceRepository
                .findTopByStockStockCodeOrderByCreatedAtDesc(stockCode)
                .map(StockPriceDto::from);
    }

    public Optional<StockPriceDto> getLatestPriceSync(String stockCode) {
        Optional<StockPriceDto> cached = getFromRedis(stockCode);
        if (cached.isPresent()) {
            return cached;
        }

        if (isMarketOpen()) {
            long deadline = System.currentTimeMillis() + POLL_TIMEOUT_MS;
            while (System.currentTimeMillis() < deadline) {
                try {
                    Thread.sleep(POLL_INTERVAL_MS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    break;
                }
                cached = getFromRedis(stockCode);
                if (cached.isPresent()) {
                    return cached;
                }
            }
        }

        return stockPriceRepository
                .findTopByStockStockCodeOrderByCreatedAtDesc(stockCode)
                .map(StockPriceDto::from);
    }

    public Optional<StockPriceDto> getLatestPrice(Stock stock) {
        return getLatestPrice(stock.getStockCode());
    }

    private Optional<StockPriceDto> getFromRedis(String stockCode) {
        try {
            String cached = redisTemplate.opsForValue().get(STOCK_PRICE_KEY + stockCode);
            if (cached != null) {
                return Optional.of(objectMapper.readValue(cached, StockPriceDto.class));
            }
        } catch (Exception e) {
            log.warn("Redis 가격 캐시 조회 실패 ({}): {}", stockCode, e.getMessage());
        }
        return Optional.empty();
    }

    private boolean isMarketOpen() {
        LocalTime now = LocalTime.now();
        return !now.isBefore(MARKET_OPEN) && !now.isAfter(MARKET_CLOSE);
    }
}
