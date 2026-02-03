package com.amagetdon.trading.controller.swagger;

import com.amagetdon.trading.dto.response.TransactionResponse;
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
public interface TransactionControllerSwagger {

    @Operation(summary = "주식 거래 내역 조회", description = "사용자의 거래 내역을 최신순으로 페이징하여 조회합니다")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            schema = @Schema(implementation = TransactionResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "page": 0,
                                      "size": 10,
                                      "totalElements": 25,
                                      "items": [
                                        {
                                          "transactionId": 124,
                                          "stockCode": "005930",
                                          "stockName": "삼성전자",
                                          "transactionType": "SELL",
                                          "quantity": 5,
                                          "price": 76000,
                                          "totalAmount": 380000,
                                          "createdAt": "2026-02-03T11:45:00",
                                          "feeAmount": 1140
                                        },
                                        {
                                          "transactionId": 123,
                                          "stockCode": "005930",
                                          "stockName": "삼성전자",
                                          "transactionType": "BUY",
                                          "quantity": 10,
                                          "price": 75000,
                                          "totalAmount": 750000,
                                          "createdAt": "2026-02-03T10:30:00",
                                          "feeAmount": 2250
                                        },
                                        {
                                          "transactionId": 122,
                                          "stockCode": "000660",
                                          "stockName": "SK하이닉스",
                                          "transactionType": "BUY",
                                          "quantity": 5,
                                          "price": 140000,
                                          "totalAmount": 700000,
                                          "createdAt": "2026-02-03T09:15:00",
                                          "feeAmount": 2100
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
    ResponseEntity<TransactionResponse> getTransactions(
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0") int page,
            @Parameter(description = "페이지 크기", example = "10") int size
    );
}
