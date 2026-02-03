package com.amagetdon.trading.controller.swagger;

import com.amagetdon.trading.dto.response.StockHoldingItemResponse;
import com.amagetdon.trading.dto.response.StockHoldingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "계좌 및 거래 내역", description = "계좌 및 거래 내역 관련 API")
public interface StockHoldingControllerSwagger {

    @Operation(summary = "내 주식 현황 조회", description = "사용자의 보유 주식 목록을 페이징하여 조회합니다")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            schema = @Schema(implementation = StockHoldingResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "page": 0,
                                      "size": 10,
                                      "totalElements": 5,
                                      "items": [
                                        {
                                          "stockCode": "005930",
                                          "stockName": "삼성전자",
                                          "quantity": 10,
                                          "avgPrice": 72000.00,
                                          "currentPrice": 75000,
                                          "changeRate": 1.41,
                                          "totalValue": 750000,
                                          "profitAmount": 30000,
                                          "profitRate": 0.0417
                                        },
                                        {
                                          "stockCode": "000660",
                                          "stockName": "SK하이닉스",
                                          "quantity": 5,
                                          "avgPrice": 140000.00,
                                          "currentPrice": 145000,
                                          "changeRate": -0.52,
                                          "totalValue": 725000,
                                          "profitAmount": 25000,
                                          "profitRate": 0.0357
                                        }
                                      ]
                                    }
                                    """)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 실패",
                    content = @Content(schema = @Schema(hidden = true))
            )
    })
    ResponseEntity<StockHoldingResponse> getStockHoldings(
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0") int page,
            @Parameter(description = "페이지 크기", example = "10") int size
    );

    @Operation(summary = "단일 주식 현황 조회", description = "특정 종목의 보유 현황을 조회합니다")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            schema = @Schema(implementation = StockHoldingItemResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "stockCode": "005930",
                                      "stockName": "삼성전자",
                                      "quantity": 10,
                                      "avgPrice": 72000.00,
                                      "currentPrice": 75000,
                                      "changeRate": 1.41,
                                      "totalValue": 750000,
                                      "profitAmount": 30000,
                                      "profitRate": 0.0417
                                    }
                                    """)
                    )
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 실패",
                    content = @Content(schema = @Schema(hidden = true))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "보유한 주식이 없습니다",
                    content = @Content(schema = @Schema(hidden = true))
            )
    })
    ResponseEntity<StockHoldingItemResponse> getSingleStockHolding(
            @Parameter(description = "종목 코드", example = "005930") String stockCode
    );
}
