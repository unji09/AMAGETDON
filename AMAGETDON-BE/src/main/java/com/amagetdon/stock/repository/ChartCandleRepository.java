package com.amagetdon.stock.repository;

import com.amagetdon.stock.entity.ChartCandle;
import com.amagetdon.stock.entity.IntervalType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChartCandleRepository extends JpaRepository<ChartCandle, Long> {

    @Query("SELECT c FROM ChartCandle c " +
            "WHERE c.stockCode.stockCode = :stockCode " +
            "AND c.intervalType = :intervalType " +
            "AND c.candleTime >= :startTime " +
            "ORDER BY c.candleTime ASC")
    List<ChartCandle> findCandles(
            @Param("stockCode") String stockCode,
            @Param("intervalType") IntervalType intervalType,
            @Param("startTime") LocalDateTime startTime
    );

}
