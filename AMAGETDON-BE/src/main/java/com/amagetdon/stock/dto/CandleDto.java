package com.amagetdon.stock.dto;

import java.time.LocalDateTime;

public record CandleDto(
        LocalDateTime candleTime,
        Integer openPrice,
        Integer highPrice,
        Integer lowPrice,
        Integer closePrice,
        Long volume
) {
}
