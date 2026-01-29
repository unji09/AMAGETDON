package com.amagetdon.trading.controller;

import com.amagetdon.trading.dto.request.TradingRequest;
import com.amagetdon.trading.dto.response.TradingResponse;
import com.amagetdon.trading.service.TradingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/trading")
public class TradingController {
    private final TradingService tradingService;

    @PostMapping("/buy")
    public ResponseEntity<TradingResponse> buyStock(
            @RequestParam Long userId,
            @RequestBody TradingRequest request
    ) {
        TradingResponse response = tradingService.buyStock(userId, request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sell")
    public ResponseEntity<TradingResponse> sellStock(
            @RequestParam Long userId,
            @RequestBody TradingRequest request
    ) {
        TradingResponse response = tradingService.sellStock(userId, request);
        return ResponseEntity.ok(response);
    }
}
