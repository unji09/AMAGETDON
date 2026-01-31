package com.amagetdon.stock.controller;

import com.amagetdon.stock.controller.swagger.StockControllerSwagger;
import com.amagetdon.stock.dto.response.CandleChartResponse;
import com.amagetdon.stock.dto.response.StockDetailResponse;
import com.amagetdon.stock.dto.response.VolumeRankingResponse;
import com.amagetdon.stock.service.StockService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/stocks")
@RequiredArgsConstructor
public class StockContoller implements StockControllerSwagger {
    private final StockService stockService;

    @GetMapping("/{stockCode}")
    @ResponseStatus(HttpStatus.OK)
    public StockDetailResponse getStock(@PathVariable String stockCode) {
        return stockService.getStockDetail(stockCode);
    }

    @GetMapping("/{stockCode}/chart/{period}")
    public CandleChartResponse getCandleChart(@PathVariable String stockCode, @PathVariable String period) {
        return stockService.getCandleChart(stockCode, period);
    }

    @GetMapping("/rankings/volume")
    public List<VolumeRankingResponse> getVolumeRankings() {
        return stockService.getVolumeRanking();
    }
}
