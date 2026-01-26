package com.amagetdon.trading.repository;

import com.amagetdon.trading.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OwnStockRepository extends JpaRepository<Transaction, Long> {
}
