package com.amagetdon.trading.controller;

import com.amagetdon.trading.dto.response.StockHoldingResponse;
import com.amagetdon.trading.service.AccountService;
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
public class AccountController {
    private final AccountService accountService;

    // TODO(재훈) : @AuthenticationPrincipal로 userId 받기
    @GetMapping("/holdings")
    public ResponseEntity<StockHoldingResponse> getStockHoldings(
            Long userId,  // 임시로 파라미터로 받음
            @PageableDefault(sort = "updatedAt", direction = Sort.Direction.ASC)
            Pageable pageable) {

        StockHoldingResponse response = accountService.getStockHoldings(userId, pageable);
        return ResponseEntity.ok(response);
    }
}
