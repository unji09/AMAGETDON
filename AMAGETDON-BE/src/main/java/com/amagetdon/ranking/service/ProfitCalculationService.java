package com.amagetdon.ranking.service;

import com.amagetdon.stock.entity.Stock;
import com.amagetdon.stock.entity.StockPrice;
import com.amagetdon.stock.repository.StockPriceRepository;
import com.amagetdon.trading.entity.StockHolding;
import com.amagetdon.trading.entity.Transaction;
import com.amagetdon.trading.entity.TransactionType;
import com.amagetdon.trading.repository.AccountRepository;
import com.amagetdon.trading.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfitCalculationService {

    private final TransactionRepository transactionRepository;
    private final StockPriceRepository stockPriceRepository;
    private final AccountRepository accountRepository;

    // 특정 유저의 순수 투자 수익을 계산(수익 = 보유주식 평가액 + (매도 총액 - 매수 총액)
    public BigDecimal calculateUserProfit(Long userId){

        BigDecimal stockValue = calculateStockValue(userId);

        Long totalBuy = 0L;
        Long totalSell = 0L;

        List<Transaction> transactions = transactionRepository
                .findByUserUserId(userId, Pageable.unpaged()).getContent();

        for(Transaction transaction : transactions){
            if(transaction.getTransactionType() == TransactionType.BUY){
                totalBuy += transaction.getNetAmount();
            } else if(transaction.getTransactionType() == TransactionType.SELL) {
                totalSell += transaction.getNetAmount();
            }
        }

        BigDecimal cashFromTrades = new BigDecimal(totalSell - totalBuy);

        BigDecimal totalProfit = stockValue.add(cashFromTrades);

        log.debug("유저 {} 수익 : 보유주식 = {}원, 거래수익 = {}원, 총수익 = {}원",
                userId, stockValue, cashFromTrades, totalProfit);

        return totalProfit;
    }

    // 특정 유저의 보유 주식 평가액을 계산
    private BigDecimal calculateStockValue(Long userId) {
        List<StockHolding> holdings = accountRepository.findByStockHoldingIdUserId(userId);

        BigDecimal totalStockValue = BigDecimal.ZERO;
        for(StockHolding holding : holdings){

            Stock stock = holding.getStock();

            Optional<StockPrice> latestPrice = stockPriceRepository
                    .findTopByStockOrderByCreatedAtDesc(stock);

            if(latestPrice.isPresent()){
                BigDecimal currentPrice = new BigDecimal(latestPrice.get().getCurrentPrice());
                BigDecimal quantity = new BigDecimal(holding.getQuantity());
                BigDecimal stockValue = currentPrice.multiply(quantity);

                totalStockValue = totalStockValue.add(stockValue);
            } else {
                log.warn("종목 {}의 최신 가격 정보가 없습니다.", stock.getStockCode());
            }
        }

        return totalStockValue;
    }

}
