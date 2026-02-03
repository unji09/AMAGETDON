package com.amagetdon.trading.controller.swagger;

import com.amagetdon.trading.dto.request.TradingRequest;
import com.amagetdon.trading.dto.response.TradingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "거래", description = "거래(매수&매도) 관련 API")
public interface TradingControllerSwagger {

    @Operation(summary = "주식 매수", description = "주식을 매수합니다")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "매수 성공",
                    content = @Content(
                            schema = @Schema(implementation = TradingResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "transactionId": 123,
                                      "stockCode": "005930",
                                      "stockName": "삼성전자",
                                      "transactionType": "BUY",
                                      "quantity": 10,
                                      "price": 75000,
                                      "totalAmount": 750000,
                                      "feeAmount": 2250,
                                      "netAmount": 752250,
                                      "remainingBalance": 9247750,
                                      "tradedAt": "2026-02-03T10:30:00"
                                    }
                                    """)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (수량 0 이하, 장시간 외 등)",
                    content = @Content(schema = @Schema(hidden = true))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 실패",
                    content = @Content(schema = @Schema(hidden = true))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "주식 정보를 찾을 수 없습니다",
                    content = @Content(schema = @Schema(hidden = true))
            )
    })
    ResponseEntity<TradingResponse> buyStock(
            @RequestBody(
                    description = "매수 요청",
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = TradingRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "stockCode": "005930",
                                      "quantity": 10
                                    }
                                    """)
                    )
            ) TradingRequest request
    );

    @Operation(summary = "주식 매도", description = "주식을 매도합니다")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "매도 성공",
                    content = @Content(
                            schema = @Schema(implementation = TradingResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "transactionId": 124,
                                      "stockCode": "005930",
                                      "stockName": "삼성전자",
                                      "transactionType": "SELL",
                                      "quantity": 5,
                                      "price": 76000,
                                      "totalAmount": 380000,
                                      "feeAmount": 1140,
                                      "netAmount": 378860,
                                      "remainingBalance": 9626610,
                                      "tradedAt": "2026-02-03T11:45:00"
                                    }
                                    """)
                    )
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (수량 0 이하, 보유 수량 부족, 장시간 외 등)",
                    content = @Content(schema = @Schema(hidden = true))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 실패",
                    content = @Content(schema = @Schema(hidden = true))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "보유하지 않은 주식입니다",
                    content = @Content(schema = @Schema(hidden = true))
            )
    })
    ResponseEntity<TradingResponse> sellStock(
            @RequestBody(
                    description = "매도 요청",
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = TradingRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "stockCode": "005930",
                                      "quantity": 5
                                    }
                                    """)
                    )
            ) TradingRequest request
    );
}
