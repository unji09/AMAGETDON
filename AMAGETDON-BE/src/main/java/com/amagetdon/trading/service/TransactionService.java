package com.amagetdon.trading.service;

import com.amagetdon.trading.dto.response.TransactionResponse;
import com.amagetdon.trading.dto.response.TransactionResponse.TransactionItem;
import com.amagetdon.trading.entity.Transaction;
import com.amagetdon.trading.repository.TransactionRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TransactionService {
    private final TransactionRepository transactionRepository;

    public TransactionResponse getTransactions(Long userId, Pageable pageable) {
        Page<Transaction> transactionPage = transactionRepository.findByUserUserId(userId, pageable);

        List<TransactionItem> items = transactionPage.getContent()
                .stream()
                .map(TransactionItem::from)
                .toList();

        return new TransactionResponse(
                transactionPage.getNumber(),
                transactionPage.getSize(),
                transactionPage.getTotalElements(),
                items
        );
    }
}
