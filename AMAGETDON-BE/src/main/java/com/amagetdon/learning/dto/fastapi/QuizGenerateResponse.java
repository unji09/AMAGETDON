package com.amagetdon.learning.dto.fastapi;

import com.fasterxml.jackson.annotation.JsonProperty;

public record QuizGenerateResponse(
        @JsonProperty("generated_count")
        Integer generatedCount,

        @JsonProperty("cached_total")
        Integer cachedTotal
) {
}