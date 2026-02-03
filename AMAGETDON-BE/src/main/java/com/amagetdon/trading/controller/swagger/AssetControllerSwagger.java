package com.amagetdon.trading.controller.swagger;

import com.amagetdon.trading.dto.response.AssetResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

@Tag(name = "계좌 및 거래 내역", description = "계좌 및 거래 내역 관련 API")
public interface AssetControllerSwagger {

    @Operation(summary = "자산 조회", description = "사용자의 전체 자산 현황을 조회합니다")
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            schema = @Schema(implementation = AssetResponse.class),
                            examples = @ExampleObject(value = """
                                    {
                                      "balance": 10000000,
                                      "stockAsset": 5000000,
                                      "totalAsset": 15000000,
                                      "totalProfitRate": 0.0417,
                                      "totalProfitAmount": 200000
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
                    description = "사용자를 찾을 수 없습니다",
                    content = @Content(schema = @Schema(hidden = true))
            )
    })
    ResponseEntity<AssetResponse> getAsset();
}
