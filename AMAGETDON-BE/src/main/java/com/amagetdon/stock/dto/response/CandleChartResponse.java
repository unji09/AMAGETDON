package com.amagetdon.stock.dto.response;

import com.amagetdon.stock.dto.CandleDto;

import java.util.List;

public record CandleChartResponse(
        String stockCode,
        String period,
        String interval,
        List<CandleDto> candles
) {
}
