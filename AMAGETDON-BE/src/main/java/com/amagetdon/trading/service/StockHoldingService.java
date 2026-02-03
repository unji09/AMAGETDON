package com.amagetdon.trading.service;

import com.amagetdon.stock.entity.StockPrice;
import com.amagetdon.stock.repository.StockPriceRepository;
import com.amagetdon.trading.dto.response.StockHoldingItemResponse;
import com.amagetdon.trading.dto.response.StockHoldingResponse;
import com.amagetdon.trading.entity.StockHolding;
import com.amagetdon.trading.repository.AccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static com.amagetdon.common.ErrorCode.PRICE_NOT_AVAILABLE;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StockHoldingService {
    private final AccountRepository accountRepository;
    private final StockPriceRepository stockPriceRepository;

    public StockHoldingResponse getStockHoldings(Long userId, Pageable pageable) {
        Page<StockHolding> holdingsPage = accountRepository.findByStockHoldingIdUserId(userId, pageable);
        List<StockHoldingItemResponse> items = convertToItems(holdingsPage.getContent());

        return new StockHoldingResponse(
                holdingsPage.getNumber(),
                holdingsPage.getSize(),
                holdingsPage.getTotalElements(),
                items
        );
    }

    private List<StockHoldingItemResponse> convertToItems(List<StockHolding> holdings) {
        return holdings.stream()
                .map(this::convertToItem)
                .toList();
    }

    private StockHoldingItemResponse convertToItem(StockHolding holding) {
        StockPrice latestPrice = getLatestStockPrice(holding);
        Integer currentPrice = Integer.parseInt(latestPrice.getCurrentPrice());
        BigDecimal changeRate = latestPrice.getChangeRate();

        return StockHoldingItemResponse.from(holding, currentPrice, changeRate);
    }

    private StockPrice getLatestStockPrice(StockHolding holding) {
        return stockPriceRepository
                .findTopByStockOrderByCreatedAtDesc(holding.getStock())
                .orElseThrow(() -> new IllegalStateException(PRICE_NOT_AVAILABLE.getMessage()));
    }
}
