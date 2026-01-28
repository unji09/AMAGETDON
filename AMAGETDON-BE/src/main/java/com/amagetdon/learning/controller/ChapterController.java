package com.amagetdon.learning.controller;

import com.amagetdon.common.ErrorResponse;
import com.amagetdon.learning.dto.chapter.BaseChaptersResponse;
import com.amagetdon.learning.service.ChapterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "학습 로드맵", description = "학습 챕터 및 진행도 조회 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/chapters")
public class ChapterController {
    private final ChapterService chapterService;

    @Operation(
            summary = "전체 학습 로드맵 조회",
            description = """
                    사용자의 학습 진행도를 포함한 전체 챕터 리스트를 조회합니다.
                    
                    - 챕터는 순차적으로 오픈됩니다.
                    - 이전 챕터가 'COMPLETED' 상태여야 다음 챕터가 'AVAILABLE'이 됩니다.
                    - 진행 데이터가 없거나 이전 단계 미완료 시 'LOCKED'로 표시됩니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "로드맵 조회 성공",
                    content = @Content(schema = @Schema(implementation = BaseChaptersResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (userId 누락 등)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
    })
    @GetMapping("/base")
    public BaseChaptersResponse getBaseChapters(
            //    TODO(지원) : 유저서비스 이후에 @RequestParam Long userId 제거
            @Parameter(description = "조회할 사용자의 고유 ID", example = "1")
            @RequestParam Long userId
    ) {
        return chapterService.getBaseChapters(userId);
    }

}
