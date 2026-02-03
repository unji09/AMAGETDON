package com.amagetdon.trading.repository;

import com.amagetdon.trading.entity.StockHolding;
import com.amagetdon.trading.entity.StockHolding.StockHoldingId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<StockHolding, StockHoldingId> {
    Page<StockHolding> findByStockHoldingIdUserId(Long userId, Pageable pageable);

    List<StockHolding> findByStockHoldingIdUserId(Long userId);

    long countByStockHoldingIdUserId(Long userId);

    Optional<StockHolding> findByStockHoldingIdUserIdAndStockHoldingIdStockCode(
            Long userId,
            String stockCode
    );
}
