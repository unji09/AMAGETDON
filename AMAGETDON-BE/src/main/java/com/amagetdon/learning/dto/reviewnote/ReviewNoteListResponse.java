package com.amagetdon.learning.dto.reviewnote;

import java.util.List;
import java.util.Map;

public record ReviewNoteListResponse(
        Boolean todayRewardReceived,
        Integer totalCount,
        Map<String, List<ReviewNoteDetail>> reviewNotes  // 챕터명 → 오답 목록
) {
}