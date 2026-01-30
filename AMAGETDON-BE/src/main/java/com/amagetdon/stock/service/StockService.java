package com.amagetdon.stock.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.stock.dto.response.StockDetailResponse;
import com.amagetdon.stock.repository.StockQueryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StockService {
    private final StockQueryRepository stockQueryRepository;

    public StockDetailResponse getStockDetail(String stockCode) {
        return stockQueryRepository.findStockDetail(stockCode)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.STOCK_INFO_NOT_FOUND.getMessage()));
    }
}
