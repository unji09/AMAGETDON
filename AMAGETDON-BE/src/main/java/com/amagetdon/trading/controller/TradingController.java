package com.amagetdon.trading.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.trading.controller.swagger.TradingControllerSwagger;
import com.amagetdon.trading.dto.request.TradingRequest;
import com.amagetdon.trading.dto.response.TradingResponse;
import com.amagetdon.trading.service.TradingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/trading")
public class TradingController implements TradingControllerSwagger {
    private final TradingService tradingService;

    @Override
    @PostMapping("/buy")
    public ResponseEntity<TradingResponse> buyStock(@RequestBody TradingRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        TradingResponse response = tradingService.buyStock(userId, request);
        return ResponseEntity.ok(response);
    }

    @Override
    @PostMapping("/sell")
    public ResponseEntity<TradingResponse> sellStock(@RequestBody TradingRequest request) {
        Long userId = SecurityUtil.getCurrentUserId();
        TradingResponse response = tradingService.sellStock(userId, request);
        return ResponseEntity.ok(response);
    }
}
