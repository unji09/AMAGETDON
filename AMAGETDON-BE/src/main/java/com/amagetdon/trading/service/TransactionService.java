package com.amagetdon.trading.service;

import com.amagetdon.trading.repository.TransactionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class TransactionService {
    private TransactionRepository transactionRepository;
}
