package com.amagetdon.stock.controller.swagger;

import com.amagetdon.stock.dto.response.StockDetailResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@Tag(name = "stock-controller", description = "주식 정보 API")
public interface StockControllerSwagger {
    @Operation(summary = "주식 상세 조회", description = "종목 코드로 주식 상세 정보를 조회")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            schema = @Schema(implementation = StockDetailResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "stockName": "삼성전자",
                                      "marketType": "KOSPI",
                                      "sectorName": "반도체",
                                      "per": 15.23,
                                      "pbr": 1.45,
                                      "marketCap": 400000000000000,
                                      "currentPrice": "72000",
                                      "changeRate": 1.41,
                                      "volume": 15234567
                                    }
                                    """)
                    )
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "요청한 리소스를 찾을 수 없습니다.",
                    content = @Content(
                            schema = @Schema(implementation = StockDetailResponse.class),
                            examples = @ExampleObject(value = """

                                    """)
                    )
            )
    })
    StockDetailResponse getStock(
            @Parameter(description = "종목 코드", example = "005930") String stockCode
    );
}
