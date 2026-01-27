package com.amagetdon.trading.service;

import com.amagetdon.trading.dto.response.TransactionItemResponse;
import com.amagetdon.trading.dto.response.TransactionListResponse;
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

    public TransactionListResponse getTransactions(Long userId, Pageable pageable) {
        Page<Transaction> transactionPage = transactionRepository.findAllByUserId(userId, pageable);

        List<TransactionItemResponse> items = transactionPage.getContent()
                .stream()
                .map(TransactionItemResponse::from)
                .toList();

        return new TransactionListResponse(
                transactionPage.getNumber(),
                transactionPage.getSize(),
                transactionPage.getTotalElements(),
                items
        );
    }
}
