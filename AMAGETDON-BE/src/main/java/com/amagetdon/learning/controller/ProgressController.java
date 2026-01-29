package com.amagetdon.learning.controller;

import com.amagetdon.learning.dto.progress.ProgressResponse;
import com.amagetdon.learning.entity.ChapterType;
import com.amagetdon.learning.service.ProgressService;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "학습 진행도", description = "사용자 챕터 진행도 조회 관련 API")
@RestController
@RequiredArgsConstructor
@RequestMapping("/progress")
public class ProgressController {

    private final ProgressService progressService;

    @GetMapping
    public ProgressResponse getProgress(Long userId, ChapterType chapterType, boolean onlyCompleted){
        return progressService.getProgress(userId, chapterType, onlyCompleted);
    }
}
