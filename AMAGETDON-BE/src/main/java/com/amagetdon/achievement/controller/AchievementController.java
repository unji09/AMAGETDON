package com.amagetdon.achievement.controller;

import com.amagetdon.achievement.dto.AchievementFilter;
import com.amagetdon.achievement.dto.AchievementResponse;
import com.amagetdon.achievement.service.AchievementService;
import com.amagetdon.common.ErrorResponse;
import com.amagetdon.common.security.SecurityUtil;
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

@Tag(name = "업적", description = "사용자 업적 조회 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/achievements")
public class AchievementController {

    private final AchievementService achievementService;

    @Operation(
            summary = "내 업적 조회",
            description = """
                    로그인 사용자의 업적 목록을 조회합니다.

                    - ALL: 모든 업적 (달성/미달성 모두)
                    - ACHIEVED: 달성한 업적만
                    - LOCKED: 미달성 업적만

                    미달성(LOCKED) 업적은 achievementIcon, achievementContent, achievedAt이 null로 반환됩니다.
                    """
    )
    @ApiResponses({
            @ApiResponse(
                    responseCode = "200",
                    description = "업적 조회 성공",
                    content = @Content(schema = @Schema(implementation = AchievementResponse.class))
            ),
            @ApiResponse(
                    responseCode = "400",
                    description = "잘못된 요청",
                    content = @Content(schema = @Schema(implementation = ErrorResponse.class))
            ),
    })
    @GetMapping("/me")
    public AchievementResponse getMyAchievements(
            @Parameter(description = "필터: ALL(전체), ACHIEVED(달성), LOCKED(미달성)", example = "ALL")
            @RequestParam(defaultValue = "ALL") AchievementFilter filter
    ) {
        Long userId = SecurityUtil.getCurrentUserId();
        return achievementService.getMyAchievements(userId, filter);
    }
}
