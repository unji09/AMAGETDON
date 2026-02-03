package com.amagetdon.trading.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.trading.dto.response.StockHoldingItemResponse;
import com.amagetdon.trading.dto.response.StockHoldingResponse;
import com.amagetdon.trading.service.StockHoldingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/accounts")
public class StockHoldingController {
    private final StockHoldingService stockHoldingService;

    @GetMapping("/holdings")
    public ResponseEntity<StockHoldingResponse> getStockHoldings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = SecurityUtil.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "updatedAt"));
        StockHoldingResponse response = stockHoldingService.getStockHoldings(userId, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/holdings/{stockCode}")
    public ResponseEntity<StockHoldingItemResponse> getSingleStockHolding(
            @PathVariable String stockCode) {
        Long userId = SecurityUtil.getCurrentUserId();
        StockHoldingItemResponse response = stockHoldingService.getSingleStockHolding(userId, stockCode);
        return ResponseEntity.ok(response);
    }
}
