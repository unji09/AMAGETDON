package com.amagetdon.trading.service;

import com.amagetdon.trading.repository.OwnStockRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class AccountService {
    private OwnStockRepository ownStockRepository;
}
