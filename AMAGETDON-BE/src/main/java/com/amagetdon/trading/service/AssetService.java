package com.amagetdon.trading.service;

import com.amagetdon.stock.entity.StockPrice;
import com.amagetdon.stock.repository.StockPriceRepository;
import com.amagetdon.trading.dto.response.AssetResponse;
import com.amagetdon.trading.entity.StockHolding;
import com.amagetdon.trading.repository.AccountRepository;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static com.amagetdon.common.ErrorCode.USER_NOT_FOUND_SIMPLE;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AssetService {
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final StockPriceRepository stockPriceRepository;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String USER_STOCKS_KEY = "kis:user_stocks";

    public AssetResponse getAsset(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException(USER_NOT_FOUND_SIMPLE.getMessage()));

        Long balance = user.getBalance();
        List<StockHolding> holdings = accountRepository.findByStockHoldingIdUserId(userId);
        AssetCalculation assetCalc = calculateTotalAsset(holdings);

        holdings.forEach(holding -> {
            String stockCode = holding.getStockHoldingId().getStockCode();
            redisTemplate.opsForValue().set(
                    USER_STOCKS_KEY + ":" + stockCode,
                    stockCode,
                    10,
                    TimeUnit.SECONDS
            );
        });

        return AssetResponse.of(
                balance,
                assetCalc.currentValue(),
                assetCalc.investment()
        );
    }

    private AssetCalculation calculateTotalAsset(List<StockHolding> holdings) {
        long totalCurrentValue = 0;
        long totalInvestment = 0;

        for (StockHolding holding : holdings) {
            totalCurrentValue += calculateCurrentValue(holding);
            totalInvestment += calculateInvestment(holding);
        }

        return new AssetCalculation(totalCurrentValue, totalInvestment);
    }

    private long calculateCurrentValue(StockHolding holding) {
        Integer currentPrice = getCurrentPrice(holding);
        return (long) holding.getQuantity() * currentPrice;
    }

    private long calculateInvestment(StockHolding holding) {
        return holding.getAvgPrice()
                .multiply(BigDecimal.valueOf(holding.getQuantity()))
                .longValue();
    }

    private Integer getCurrentPrice(StockHolding holding) {
        return stockPriceRepository
                .findTopByStockOrderByCreatedAtDesc(holding.getStock())
                .map(StockPrice::getCurrentPrice)
                .map(Integer::parseInt)
                .orElse(0);
    }

    private record AssetCalculation(long currentValue, long investment) {
    }
}
