package com.amagetdon.trading.controller;

import com.amagetdon.trading.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/accounts")
public class TransactionController {
    private final TransactionService transactionService;
}
