package com.amagetdon.watchlist.controller.swagger;

import com.amagetdon.watchlist.dto.request.WatchlistAddRequest;
import com.amagetdon.watchlist.dto.response.WatchlistResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "관심 종목", description = "관심 종목 관련 API")
public interface WatchlistControllerSwagger {

    @Operation(summary = "관심 종목 조회", description = "사용자의 관심 종목 목록을 최신순으로 페이징하여 조회합니다")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            schema = @Schema(implementation = WatchlistResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "page": 0,
                                      "size": 20,
                                      "totalElements": 12,
                                      "items": [
                                        {
                                          "watchlistId": 1,
                                          "stockCode": "005930",
                                          "stockName": "삼성전자",
                                          "marketType": "KOSPI",
                                          "currentPrice": 75000,
                                          "changeRate": 1.41,
                                          "createdAt": "2026-02-01T14:20:00"
                                        },
                                        {
                                          "watchlistId": 2,
                                          "stockCode": "000660",
                                          "stockName": "SK하이닉스",
                                          "marketType": "KOSPI",
                                          "currentPrice": 145000,
                                          "changeRate": -0.52,
                                          "createdAt": "2026-02-01T14:15:00"
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
    ResponseEntity<WatchlistResponse> getWatchlist(
            @Parameter(description = "페이지 번호 (0부터 시작)", example = "0") int page,
            @Parameter(description = "페이지 크기", example = "20") int size
    );

    @Operation(summary = "관심 종목 추가", description = "종목을 관심 종목에 추가합니다 (최대 50개)")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "추가 성공",
                    content = @Content(schema = @Schema(hidden = true))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (중복, 최대 개수 초과, 잘못된 종목 코드)",
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
    ResponseEntity<Void> addToWatchlist(
            @RequestBody(
                    description = "관심 종목 추가 요청",
                    required = true,
                    content = @Content(
                            schema = @Schema(implementation = WatchlistAddRequest.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "stockCode": "005930"
                                    }
                                    """)
                    )
            ) WatchlistAddRequest request
    );

    @Operation(summary = "관심 종목 삭제", description = "관심 종목에서 종목을 삭제합니다")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "삭제 성공",
                    content = @Content(schema = @Schema(hidden = true))
            ),
            @ApiResponse(
                    responseCode = "401",
                    description = "인증 실패",
                    content = @Content(schema = @Schema(hidden = true))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "관심 종목에 대한 권한이 없습니다",
                    content = @Content(schema = @Schema(hidden = true))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "관심 종목을 찾을 수 없습니다",
                    content = @Content(schema = @Schema(hidden = true))
            )
    })
    ResponseEntity<Void> removeFromWatchlist(
            @Parameter(description = "관심 종목 ID", example = "1") Long watchlistId
    );
}
