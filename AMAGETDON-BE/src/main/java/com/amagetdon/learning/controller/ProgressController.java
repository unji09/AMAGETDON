package com.amagetdon.learning.controller;

import com.amagetdon.common.ErrorResponse;
import com.amagetdon.learning.dto.progress.ProgressResponse;
import com.amagetdon.learning.entity.ChapterType;
import com.amagetdon.learning.service.ProgressService;
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

@Tag(name = "학습 진행도", description = "사용자 챕터 진행도 조회 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/progress")
public class ProgressController {

    private final ProgressService progressService;

    @Operation(
            summary = "사용자 챕터 진행도 조회",
            description = """
                    로그인 사용자의 전체 챕터 진행도를 조회합니다.
                    
                    - chapterType을 지정하면 해당 타입의 진행도만 조회합니다.
                    - onlyCompleted=true이면 완료된 진행도만 반환합니다.
                    - 진행 데이터가 없으면 progresses는 빈 배열([])로 반환됩니다.
                    
                    (현재는 인증/인가 미도입 상태로 userId를 임시로 RequestParam으로 받습니다.)
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "진행도 조회 성공",
                    content = @Content(schema = @Schema(implementation = ProgressResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청 (필수 파라미터 누락 등)",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
    })
    @GetMapping
    public ProgressResponse getProgress(
            // TODO(지원) : 유저서비스/인증 이후 userId 제거
            @Parameter(description = "조회할 사용자의 고유 ID", example = "1")
            @RequestParam Long userId,

            @Parameter(
                    description = "조회할 챕터 타입 (미입력 시 전체). 예: NORMAL/AGGRESSIVE/NEUTRAL/STABLE",
                    example = "NORMAL"
            )
            @RequestParam(required = false) ChapterType chapterType,

            @Parameter(description = "완료된 진행도만 조회할지 여부 (기본값=false)", example = "false")
            @RequestParam(defaultValue = "false") boolean onlyCompleted
    ){
        return progressService.getProgress(userId, chapterType, onlyCompleted);
    }
}
