package com.amagetdon.learning.controller;

import com.amagetdon.common.ErrorResponse;
import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.learning.dto.chapter.BaseChaptersResponse;
import com.amagetdon.learning.dto.chapter.ChapterDetailResponse;
import com.amagetdon.learning.dto.chapter.SideChaptersResponse;
import com.amagetdon.learning.dto.quiz.ChapterQuizzesResponse;
import com.amagetdon.learning.entity.ChapterType;
import com.amagetdon.learning.service.ChapterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
    public BaseChaptersResponse getBaseChapters() {
        Long userId = SecurityUtil.getCurrentUserId();
        return chapterService.getBaseChapters(userId);
    }

    @Operation(
            summary = "챕터 상세 조회",
            description = """
                    챕터 상세 화면에서 학습 본문을 조회합니다.
                    
                    - status=LOCKED인 챕터는 상세 조회가 불가하며, 서버는 403을 반환합니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "챕터 상세 조회 성공",
                    content = @Content(schema = @Schema(implementation = ChapterDetailResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "잠긴 챕터 조회 불가",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "챕터를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
    })
    @GetMapping("/{chapterId}")
    public ChapterDetailResponse getChapterDetail(
            @Parameter(description = "챕터 ID", example = "1")
            @PathVariable Long chapterId
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        return chapterService.getChapterDetail(userId, chapterId);
    }

    @Operation(
            summary = "샛길 챕터 조회",
            description = """
                    사용자의 투자 성향에 맞는 샛길 챕터 리스트를 조회합니다.

                    - chapterType 미입력 시 사용자의 투자 성향 기준으로 조회합니다.
                    - 샛길 챕터도 순차적으로 오픈됩니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "샛길 조회 성공",
                    content = @Content(schema = @Schema(implementation = SideChaptersResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "사용자를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
    })
    @GetMapping("/side")
    public SideChaptersResponse getSideChapters(
            @Parameter(description = "조회할 성향(미입력 시 사용자 성향)", example = "AGGRESSIVE")
            @RequestParam(required = false) ChapterType chapterType
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        return chapterService.getSideChapters(userId, chapterType);
    }

    @Operation(
            summary = "챕터별 퀴즈 조회",
            description = """
                    커리큘럼 챕터의 퀴즈 10문제를 조회합니다.
                    
                    - OX 4문제(40%), 객관식 6문제(60%)로 구성됩니다.
                    - 정답률 60% 이상(10문제 중 6문제 이상) 달성 시 챕터가 완료됩니다.
                    - 일반 커리큘럼(NORMAL)은 300,000원, 성향별 맞춤 커리큘럼은 100,000원의 보상이 지급됩니다.
                    - status=LOCKED인 챕터는 퀴즈 조회가 불가하며, 서버는 403을 반환합니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "챕터 퀴즈 조회 성공",
                    content = @Content(schema = @Schema(implementation = ChapterQuizzesResponse.class))
            ),
            @ApiResponse(
                    responseCode = "403",
                    description = "잠긴 챕터의 퀴즈 조회 불가",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "404",
                    description = "챕터를 찾을 수 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
            @ApiResponse(
                    responseCode = "500",
                    description = "챕터에 충분한 퀴즈가 없음",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            )
    })
    @GetMapping("/{chapterId}/quizzes")
    public ChapterQuizzesResponse getChapterQuizzes(
            @Parameter(description = "챕터 ID", example = "5")
            @PathVariable Long chapterId
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        return chapterService.getChapterQuizzes(userId, chapterId);
    }
}
