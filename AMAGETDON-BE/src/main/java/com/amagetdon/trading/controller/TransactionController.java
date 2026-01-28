package com.amagetdon.trading.controller;

import com.amagetdon.trading.dto.response.TransactionResponse;
import com.amagetdon.trading.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/accounts")
public class TransactionController {
    private final TransactionService transactionService;

    // TODO(재훈) : @AuthenticationPrincipal로 userId 받기
    @GetMapping("/transactions")
    public ResponseEntity<TransactionResponse> getTransactions(
            Long userId,  // 임시로 파라미터로 받음
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        TransactionResponse response = transactionService.getTransactions(userId, pageable);

        return ResponseEntity.ok(response);
    }
}
