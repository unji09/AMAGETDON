package com.amagetdon.stock.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.stock.dto.response.StockDetailResponse;
import com.amagetdon.stock.repository.StockQueryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class StockService {
    private final StockQueryRepository stockQueryRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String USER_STOCKS_KEY = "kis:user_stocks";

    public StockDetailResponse getStockDetail(String stockCode) {

        redisTemplate.opsForValue().set(
                USER_STOCKS_KEY + ":" + stockCode,
                stockCode,
                5,
                TimeUnit.MINUTES
        );

        return stockQueryRepository.findStockDetail(stockCode)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.STOCK_INFO_NOT_FOUND.getMessage()));
    }
}
