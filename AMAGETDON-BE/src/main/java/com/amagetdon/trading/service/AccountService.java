package com.amagetdon.trading.service;

import com.amagetdon.trading.repository.StockHoldingRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {
    private StockHoldingRepository stockHoldingRepository;
}
