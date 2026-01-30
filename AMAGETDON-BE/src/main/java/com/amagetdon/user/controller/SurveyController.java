package com.amagetdon.user.controller;

import com.amagetdon.user.dto.request.SurveyResultRequest;
import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/surveys")
public class SurveyController {

    private final SurveyService surveyService;

    @GetMapping
    public ResponseEntity<?> getSurveys() {
        return ResponseEntity.ok(surveyService.getAllSurveys());
    }

    @PutMapping
    public ResponseEntity<?> submitSurveyResult(@RequestBody SurveyResultRequest request) {
        InvestmentType result = surveyService.submitSurvey(request.score());
        return ResponseEntity.ok(result);
    }

}
