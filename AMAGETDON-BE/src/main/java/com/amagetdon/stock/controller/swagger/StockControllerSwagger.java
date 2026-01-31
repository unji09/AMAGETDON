package com.amagetdon.stock.controller.swagger;

import com.amagetdon.stock.dto.response.CandleChartResponse;
import com.amagetdon.stock.dto.response.StockDetailResponse;
import com.amagetdon.stock.dto.response.VolumeRankingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.List;

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

    @Operation(summary = "차트 데이터 조회", description = "종목 코드와 기간으로 차트 캔들 데이터를 조회")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            schema = @Schema(implementation = CandleChartResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "stockName": "삼성전자",
                                      "period": "1D",
                                      "interval": "5m",
                                      "candles": [
                                        {
                                          "candleTime": "2026-01-19T09:00:00",
                                          "openPrice": 74500,
                                          "highPrice": 74800,
                                          "lowPrice": 74300,
                                          "closePrice": 74600,
                                          "volume": 125430
                                        },
                                        {
                                          "candleTime": "2026-01-19T09:05:00",
                                          "openPrice": 74600,
                                          "highPrice": 75000,
                                          "lowPrice": 74500,
                                          "closePrice": 74900,
                                          "volume": 234561
                                        }
                                      ]
                                    }
                                    """)
                    )
            ),
            @ApiResponse(responseCode = "400", description = "잘못된 기간"),
            @ApiResponse(responseCode = "404", description = "종목을 찾을 수 없음")
    })
    CandleChartResponse getCandleChart(
            @Parameter(description = "종목 코드", example = "005930") String stockCode,
            @Parameter(description = "기간 (1D, 1W, 3M, 1Y)") String period
    );

    @Operation(summary = "거래량 순위 조회", description = "거래량 상위 30개 종목을 조회")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            schema = @Schema(implementation = VolumeRankingResponse.class),
                            examples = @ExampleObject(value = """
                                    [
                                      {
                                        "rank": 1,
                                        "stockCode": "005930",
                                        "stockName": "삼성전자",
                                        "currentPrice": "75000",
                                        "changeRate": 1.41,
                                        "volume": 15234567
                                      },
                                      {
                                        "rank": 2,
                                        "stockCode": "000660",
                                        "stockName": "SK하이닉스",
                                        "currentPrice": "145000",
                                        "changeRate": -0.52,
                                        "volume": 8567234
                                      }
                                    ]
                                    """)
                    )
            )
    })
    List<VolumeRankingResponse> getVolumeRankings();
}
