package com.amagetdon.user.controller;

import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.user.dto.response.PersonalityAnalyzeResponse;
import com.amagetdon.user.service.PersonalityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/personality")
@Tag(name = "Personality", description = "투자 성향 분석 API")
public class PersonalityController {

    private final PersonalityService personalityService;

    @PostMapping("/analyze")
    @Operation(summary = "업적 기반 성향 분석", description = "달성한 업적을 기반으로 투자 성향을 분석합니다. 최소 5개 이상의 업적이 필요합니다.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "분석 성공"),
            @ApiResponse(responseCode = "401", description = "인증 실패"),
            @ApiResponse(responseCode = "500", description = "서버 오류")
    })
    public ResponseEntity<PersonalityAnalyzeResponse> analyzePersonality() {
        Long userId = SecurityUtil.getCurrentUserId();
        PersonalityAnalyzeResponse response = personalityService.analyzePersonality(userId);
        return ResponseEntity.ok(response);
    }
}
