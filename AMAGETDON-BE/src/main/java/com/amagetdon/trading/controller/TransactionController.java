package com.amagetdon.trading.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.trading.controller.swagger.TransactionControllerSwagger;
import com.amagetdon.trading.dto.response.TransactionResponse;
import com.amagetdon.trading.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/accounts")
public class TransactionController implements TransactionControllerSwagger {
    private final TransactionService transactionService;

    @Override
    @GetMapping("/transactions")
    public ResponseEntity<TransactionResponse> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = SecurityUtil.getCurrentUserId();
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        TransactionResponse response = transactionService.getTransactions(userId, pageable);
        return ResponseEntity.ok(response);
    }
}
