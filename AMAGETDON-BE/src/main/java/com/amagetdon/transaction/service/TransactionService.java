package com.amagetdon.transaction.service;

import com.amagetdon.transaction.repository.TransactionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Transactional
public class TransactionService {
    private TransactionRepository transactionRepository;
}
