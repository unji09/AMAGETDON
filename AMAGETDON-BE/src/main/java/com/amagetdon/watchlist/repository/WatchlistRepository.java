package com.amagetdon.watchlist.repository;

import com.amagetdon.watchlist.entity.Watchlist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface WatchlistRepository extends JpaRepository<Watchlist, Long> {
    Page<Watchlist> findByUserUserId(Long userId, Pageable pageable);

    boolean existsByUserUserIdAndStockStockCode(Long userId, String stockCode);

    long countByUserUserId(Long userId);

    Optional<Watchlist> findByUserUserIdAndStockStockCode(Long userId, String stockCode);
}
