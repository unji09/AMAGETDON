package com.amagetdon.user.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PersonalityAnalyzeResponse {

    private Boolean success;

    @JsonProperty("can_analyze")
    private Boolean canAnalyze;

    @JsonProperty("achievement_count")
    private Integer achievementCount;

    @JsonProperty("initial_type")
    private String initialType;

    @JsonProperty("predicted_type")
    private String predictedType;

    private Double confidence;

    private Map<String, Double> probabilities;

    private String message;
}
