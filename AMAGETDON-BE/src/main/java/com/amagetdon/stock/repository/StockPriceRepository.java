package com.amagetdon.stock.repository;

import com.amagetdon.stock.entity.StockPrice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StockPriceRepository extends JpaRepository<StockPrice, Long> {
    Optional<StockPrice> findTopByStockStockCodeOrderByCreatedAtDesc(String stockCode);
}
