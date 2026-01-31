package com.amagetdon.user.controller.swagger;

import com.amagetdon.user.dto.request.SurveyResultRequest;
import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.entity.Survey;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;

import java.util.List;

@Tag(name = "투자 성향 설문", description = "투자 성향 설문 API")
public interface SurveyControllerSwagger {

    @Operation(
            summary = "설문 문항 조회",
            description = "투자 성향 분석을 위한 설문 문항 목록을 조회합니다."
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "조회 성공",
                    content = @Content(
                            schema = @Schema(implementation = Survey.class),
                            examples = @ExampleObject(value = """
                                    [
                                      {
                                        "id": 1,
                                        "question": "위험을 감수하더라도 높은 수익을 추구하시나요?"
                                      },
                                      {
                                        "id": 2,
                                        "question": "안정적인 수익이 더 중요하다고 생각하시나요?"
                                      }
                                    ]
                                    """)
                    )
            )
    })
    ResponseEntity<List<Survey>> getSurveys();

    @Operation(
            summary = "설문 결과 제출",
            description = """
                    설문 점수를 제출하여 사용자의 투자 성향을 계산합니다.
                    
                    점수 기준:
                    - 10 이하: STABLE
                    - 11 ~ 14: NEUTRAL
                    - 15 이상: AGGRESSIVE
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "설문 제출 성공",
                    content = @Content(
                            schema = @Schema(implementation = InvestmentType.class),
                            examples = @ExampleObject(value = "\"NEUTRAL\"")
                    )
            ),
            @ApiResponse(responseCode = "401", description = "인증되지 않은 사용자"),
            @ApiResponse(responseCode = "404", description = "사용자를 찾을 수 없음")
    })
    ResponseEntity<InvestmentType> submitSurveyResult(
            @Parameter(description = "설문 결과 점수", required = true)
            SurveyResultRequest request
    );
}
