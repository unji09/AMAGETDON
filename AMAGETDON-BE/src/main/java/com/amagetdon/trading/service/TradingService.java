package com.amagetdon.trading.service;

import com.amagetdon.stock.entity.Stock;
import com.amagetdon.stock.entity.StockPrice;
import com.amagetdon.stock.repository.StockPriceRepository;
import com.amagetdon.stock.repository.StockRepository;
import com.amagetdon.trading.dto.request.TradingRequest;
import com.amagetdon.trading.dto.response.TradingResponse;
import com.amagetdon.trading.entity.StockHolding;
import com.amagetdon.trading.entity.StockHolding.StockHoldingId;
import com.amagetdon.trading.entity.Transaction;
import com.amagetdon.trading.entity.TransactionType;
import com.amagetdon.trading.repository.AccountRepository;
import com.amagetdon.trading.repository.TransactionRepository;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class TradingService {
    private final UserRepository userRepository;
    private final StockRepository stockRepository;
    private final StockPriceRepository stockPriceRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    @Transactional
    public TradingResponse buyStock(Long userId, TradingRequest request) {
        return executeTrade(userId, request, TransactionType.BUY);
    }

    @Transactional
    public TradingResponse sellStock(Long userId, TradingRequest request) {
        return executeTrade(userId, request, TransactionType.SELL);
    }

    private TradingResponse executeTrade(Long userId, TradingRequest request, TransactionType type) {
        // 사용자 및 주식 정보 조회
        User user = findUser(userId);
        Stock stock = findStock(request.stockCode());
        Integer currentPrice = getCurrentPrice(stock);

        // 거래 생성
        Transaction transaction = Transaction.of(user, stock, request.quantity(), currentPrice, type);
        Long netAmount = transaction.getNetAmount();

        // TransactionType별 처리
        switch (type) {
            case BUY -> processBuy(user, stock, request, currentPrice, netAmount);
            case SELL -> processSell(user, request, netAmount);
        }

        // 거래 내역 저장
        transactionRepository.save(transaction);

        return TradingResponse.of(transaction, user.getBalance());
    }

    private void processBuy(User user, Stock stock, TradingRequest request, Integer currentPrice, Long netAmount) {
        // 잔액 차감
        user.deductBalance(netAmount);

        // 보유 주식 업데이트
        StockHoldingId holdingId = new StockHoldingId(request.stockCode(), user.getUserId());
        StockHolding holding = accountRepository.findById(holdingId)
                .orElse(createNewHolding(holdingId, stock, user));

        // 평균 단가 재계산 및 수량 증가
        BigDecimal newAvgPrice = calculateNewAvgPrice(
                holding.getAvgPrice(),
                holding.getQuantity(),
                BigDecimal.valueOf(currentPrice),
                request.quantity()
        );

        holding.addQuantity(request.quantity(), newAvgPrice);
        accountRepository.save(holding);
    }

    private void processSell(User user, TradingRequest request, Long netAmount) {
        // 잔액 증가
        user.addBalance(netAmount);

        // 보유 주식 확인 및 감소
        StockHoldingId holdingId = new StockHoldingId(request.stockCode(), user.getUserId());
        StockHolding holding = accountRepository.findById(holdingId)
                .orElseThrow(() -> new IllegalArgumentException("보유한 주식이 없습니다."));

        holding.subtractQuantity(request.quantity());

        if (holding.getQuantity() == 0) {
            accountRepository.delete(holding);
        } else {
            accountRepository.save(holding);
        }
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private Stock findStock(String stockCode) {
        return stockRepository.findByStockCode(stockCode)
                .orElseThrow(() -> new IllegalArgumentException("주식 정보를 찾을 수 없습니다."));
    }

    private StockHolding createNewHolding(StockHoldingId holdingId, Stock stock, User user) {
        return StockHolding.builder()
                .stockHoldingId(holdingId)
                .stock(stock)
                .user(user)
                .quantity(0)
                .avgPrice(BigDecimal.ZERO)
                .build();
    }

    private Integer getCurrentPrice(Stock stock) {
        return stockPriceRepository
                .findTopByStockOrderByCreatedAtDesc(stock)
                .map(StockPrice::getCurrentPrice)
                .map(Integer::parseInt)
                .orElseThrow(() -> new IllegalStateException("현재가를 조회할 수 없습니다."));
    }

    private BigDecimal calculateNewAvgPrice(
            BigDecimal currentAvgPrice,
            Integer currentQuantity,
            BigDecimal buyPrice,
            Integer buyQuantity
    ) {
        if (currentQuantity == 0) {
            return buyPrice;
        }

        BigDecimal currentTotal = currentAvgPrice.multiply(BigDecimal.valueOf(currentQuantity));
        BigDecimal buyTotal = buyPrice.multiply(BigDecimal.valueOf(buyQuantity));
        BigDecimal newTotal = currentTotal.add(buyTotal);
        BigDecimal newQuantity = BigDecimal.valueOf(currentQuantity + buyQuantity);

        return newTotal.divide(newQuantity, 2, RoundingMode.HALF_UP);
    }
}
