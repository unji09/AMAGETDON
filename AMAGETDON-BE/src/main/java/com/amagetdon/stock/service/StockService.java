package com.amagetdon.stock.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.stock.dto.CandleDto;
import com.amagetdon.stock.dto.response.CandleChartResponse;
import com.amagetdon.stock.dto.response.StockDetailResponse;
import com.amagetdon.stock.dto.response.StockSearchResponse;
import com.amagetdon.stock.dto.response.VolumeRankingResponse;
import com.amagetdon.stock.entity.ChartCandle;
import com.amagetdon.stock.entity.IntervalType;
import com.amagetdon.stock.repository.ChartCandleRepository;
import com.amagetdon.stock.repository.StockQueryRepository;
import com.amagetdon.stock.repository.StockRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class StockService {
    private final StockQueryRepository stockQueryRepository;
    private final ChartCandleRepository chartCandleRepository;
    private final StockRepository stockRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String USER_STOCKS_KEY = "kis:user_stocks";
    private static final String TOP_STOCKS_KEY = "kis:top_30_stocks";

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

    public CandleChartResponse getCandleChart(String stockCode, String period) {
        String interval = switch (period) {
            case "1D" -> "5m";
            case "1W" -> "30m";
            case "3M" -> "1d";
            case "1Y" -> "1w";
            default -> throw new IllegalArgumentException(ErrorCode.WRONG_PERIOD.getMessage());
        };

        LocalDateTime startTime = switch (period) {
            case "1D" -> LocalDateTime.now().minusDays(1);
            case "1W" -> LocalDateTime.now().minusWeeks(1);
            case "3M" -> LocalDateTime.now().minusMonths(3);
            case "1Y" -> LocalDateTime.now().minusYears(1);
            default -> throw new IllegalArgumentException(ErrorCode.WRONG_PERIOD.getMessage());
        };

        List<ChartCandle> candles = chartCandleRepository.findCandles(
                stockCode,
                IntervalType.fromValue(interval),
                startTime
        );

        List<CandleDto> candleDtos = candles.stream()
                .map(c -> new CandleDto(
                        c.getCandleTime(),
                        c.getOpenPrice(),
                        c.getHighPrice(),
                        c.getLowPrice(),
                        c.getClosePrice(),
                        c.getVolume()
                ))
                .toList();

        return new CandleChartResponse(stockCode, period, interval, candleDtos);
    }

    public List<VolumeRankingResponse> getVolumeRanking() {
        List<String> stockCodes = redisTemplate.opsForList().range(TOP_STOCKS_KEY, 0, -1);

        if (stockCodes == null || stockCodes.isEmpty()) {
            return List.of();
        }

        return stockQueryRepository.findTopStocks(stockCodes);
    }

    public List<StockSearchResponse> searchStocks(String keyword) {
        return stockRepository.findByStockNameContaining(keyword)
                .stream()
                .map(s -> new StockSearchResponse(s.getStockCode(), s.getStockName()))
                .toList();
    }
}
