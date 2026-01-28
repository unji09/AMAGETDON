package com.amagetdon.trading.repository;

import com.amagetdon.trading.entity.StockHolding;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockHoldingRepository extends JpaRepository<StockHolding, Long> {
}
