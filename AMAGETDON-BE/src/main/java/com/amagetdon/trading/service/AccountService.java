package com.amagetdon.trading.service;

import com.amagetdon.stock.entity.StockPrice;
import com.amagetdon.stock.repository.StockPriceRepository;
import com.amagetdon.trading.dto.response.StockHoldingResponse;
import com.amagetdon.trading.dto.response.StockHoldingResponse.StockHoldingItem;
import com.amagetdon.trading.entity.StockHolding;
import com.amagetdon.trading.repository.StockHoldingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountService {
    private final StockHoldingRepository stockHoldingRepository;
    private final StockPriceRepository stockPriceRepository;

    public StockHoldingResponse getStockHoldings(Long userId, Pageable pageable) {
        Page<StockHolding> holdingsPage = stockHoldingRepository.findByStockHoldingIdUserId(userId, pageable);
        List<StockHoldingItem> items = convertToItems(holdingsPage.getContent());

        return new StockHoldingResponse(
                holdingsPage.getNumber(),
                holdingsPage.getSize(),
                holdingsPage.getTotalElements(),
                items
        );
    }

    private List<StockHoldingItem> convertToItems(List<StockHolding> holdings) {
        return holdings.stream()
                .map(this::convertToItem)
                .toList();
    }

    private StockHoldingItem convertToItem(StockHolding holding) {
        Integer currentPrice = getCurrentPrice(holding);
        return StockHoldingItem.from(holding, currentPrice);
    }

    private Integer getCurrentPrice(StockHolding holding) {
        return stockPriceRepository
                .findTopByStockOrderByCreatedAtDesc(holding.getStock())
                .map(StockPrice::getCurrentPrice)
                .map(Integer::parseInt)
                .orElseThrow(() -> new IllegalStateException("주가 정보를 찾을 수 없습니다."));
    }
}
