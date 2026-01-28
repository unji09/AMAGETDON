package com.amagetdon.learning.controller;

import com.amagetdon.learning.dto.chapter.BaseChaptersResponse;
import com.amagetdon.learning.service.ChapterService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/chapters")
public class ChapterController {
    private final ChapterService chapterService;

//    TODO : 유저서비스 이후에 @RequestParam Long userId 제거
    @GetMapping("/base")
    public BaseChaptersResponse getBaseChapters(@RequestParam Long userId) {
        return chapterService.getBaseChapters(userId);
    }

}
