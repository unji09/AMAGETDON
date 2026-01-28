package com.amagetdon.learning.service;

import com.amagetdon.learning.dto.chapter.BaseChaptersResponse;

public interface ChapterService {
    BaseChaptersResponse getBaseChapters(Long userId);
}

