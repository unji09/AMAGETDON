package com.amagetdon.trading.controller;

import com.amagetdon.trading.service.TradingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/trading")
public class TradingController {
    private final TradingService tradingService;
}
