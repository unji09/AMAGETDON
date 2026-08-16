package com.amagetdon.stock.repository;

import com.amagetdon.stock.entity.Stock;
import com.amagetdon.stock.entity.StockStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StockRepository extends JpaRepository<Stock, String> {
    List<Stock> findByStockNameContainingAndStockStatus(String keyword, StockStatus stockStatus);
}
