package com.amagetdon.trading.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.trading.dto.response.StockHoldingResponse;
import com.amagetdon.trading.service.StockHoldingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/accounts")
public class StockHoldingController {
    private final StockHoldingService stockHoldingService;

    @GetMapping("/holdings")
    public ResponseEntity<StockHoldingResponse> getStockHoldings(
            @PageableDefault(sort = "updatedAt", direction = Sort.Direction.ASC)
            Pageable pageable) {
        Long userId = SecurityUtil.getCurrentUserId();
        StockHoldingResponse response = stockHoldingService.getStockHoldings(userId, pageable);
        return ResponseEntity.ok(response);
    }
}
