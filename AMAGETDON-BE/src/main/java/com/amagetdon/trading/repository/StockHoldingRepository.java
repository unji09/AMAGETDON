package com.amagetdon.trading.repository;

import com.amagetdon.trading.entity.StockHolding;
import com.amagetdon.trading.entity.StockHolding.StockHoldingId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StockHoldingRepository extends JpaRepository<StockHolding, StockHoldingId> {
    Page<StockHolding> findByStockHoldingIdUserId(Long userId, Pageable pageable);
}
