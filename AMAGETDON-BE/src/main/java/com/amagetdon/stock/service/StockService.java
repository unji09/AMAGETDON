package com.amagetdon.stock.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.stock.dto.CandleDto;
import com.amagetdon.stock.dto.StockPriceDto;
import com.amagetdon.stock.dto.response.CandleChartResponse;
import com.amagetdon.stock.dto.response.StockDetailResponse;
import com.amagetdon.stock.dto.response.StockSearchResponse;
import com.amagetdon.stock.dto.response.VolumeRankingResponse;
import com.amagetdon.stock.entity.ChartCandle;
import com.amagetdon.stock.entity.IntervalType;
import com.amagetdon.stock.entity.Stock;
import com.amagetdon.stock.repository.ChartCandleRepository;
import com.amagetdon.stock.repository.StockRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockService {
    private final ChartCandleRepository chartCandleRepository;
    private final StockRepository stockRepository;
    private final StockPriceCacheService stockPriceCacheService;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String USER_STOCKS_KEY = "kis:user_stocks";
    private static final String TOP_STOCKS_KEY = "kis:top_10_stocks";

    public StockDetailResponse getStockDetail(String stockCode) {

        redisTemplate.opsForValue().set(
                USER_STOCKS_KEY + ":" + stockCode,
                stockCode,
                1,
                TimeUnit.MINUTES
        );

        Stock stock = stockRepository.findById(stockCode)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.STOCK_INFO_NOT_FOUND.getMessage()));

        StockPriceDto price = stockPriceCacheService.getLatestPriceSync(stockCode)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.PRICE_NOT_AVAILABLE.getMessage()));

        return StockDetailResponse.from(stock, price);
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

        return IntStream.range(0, stockCodes.size())
                .mapToObj(i -> stockRepository.findById(stockCodes.get(i))
                        .flatMap(stock -> stockPriceCacheService.getLatestPrice(stockCodes.get(i))
                                .map(price -> VolumeRankingResponse.from(i + 1, stock, price)))
                        .orElse(null))
                .filter(Objects::nonNull)
                .toList();
    }

    public List<StockSearchResponse> searchStocks(String keyword) {
        if (keyword == null || keyword.length() < 2) {
            throw new IllegalArgumentException(ErrorCode.KEYWORD_TOO_SHORT.getMessage());
        }

        return stockRepository.findByStockNameContaining(keyword)
                .stream()
                .map(s -> new StockSearchResponse(s.getStockCode(), s.getStockName()))
                .toList();
    }
}
