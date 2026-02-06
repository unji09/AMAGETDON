package com.amagetdon.stock.repository;

import com.amagetdon.stock.dto.response.StockDetailResponse;
import com.amagetdon.stock.dto.response.VolumeRankingResponse;
import com.amagetdon.stock.entity.QSector;
import com.amagetdon.stock.entity.QStock;
import com.amagetdon.stock.entity.QStockPrice;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class StockQueryRepository {
    private final JPAQueryFactory queryFactory;

    public Optional<StockDetailResponse> findStockDetail(String stockCode) {
        QStockPrice sp = QStockPrice.stockPrice;
        QStock s = QStock.stock;
        QSector sec = QSector.sector;

        return Optional.ofNullable(queryFactory
                .select(Projections.constructor(StockDetailResponse.class,
                        s.stockName,
                        s.marketType,
                        sec.sectorName,
                        s.per,
                        s.pbr,
                        s.marketCap,
                        sp.currentPrice,
                        sp.changeRate,
                        sp.changeAmount,
                        sp.volume
                ))
                .from(sp)
                .join(sp.stock, s)
                .join(s.sector, sec)
                .where(s.stockCode.eq(stockCode))
                .orderBy(sp.createdAt.desc())
                .fetchFirst());
    }

    public List<VolumeRankingResponse> findTopStocks(List<String> stockCodes) {
        QStock s = QStock.stock;
        QStockPrice sp = QStockPrice.stockPrice;

        List<VolumeRankingResponse> results = new ArrayList<>();

        for (int i = 0; i < stockCodes.size(); i++) {
            String stockCode = stockCodes.get(i);

            VolumeRankingResponse response = queryFactory
                    .select(Projections.constructor(VolumeRankingResponse.class,
                            Expressions.constant(i + 1),
                            s.stockCode,
                            s.stockName,
                            sp.currentPrice,
                            sp.changeRate,
                            sp.volume
                    ))
                    .from(sp)
                    .join(sp.stock, s)
                    .where(s.stockCode.eq(stockCode))
                    .orderBy(sp.createdAt.desc())
                    .fetchFirst();

            if (response != null) {
                results.add(response);
            }
        }

        return results;
    }
}
