package com.amagetdon.user.controller;

import com.amagetdon.user.controller.swagger.SurveyControllerSwagger;
import com.amagetdon.user.dto.request.SurveyResultRequest;
import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.entity.Survey;
import com.amagetdon.user.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/surveys")
public class SurveyController implements SurveyControllerSwagger {

    private final SurveyService surveyService;

    @GetMapping
    public ResponseEntity<List<Survey>> getSurveys() {
        return ResponseEntity.ok(surveyService.getAllSurveys());
    }

    @PutMapping
    public ResponseEntity<InvestmentType> submitSurveyResult(@RequestBody SurveyResultRequest request) {
        InvestmentType result = surveyService.submitSurvey(request.score());
        return ResponseEntity.ok(result);
    }

}
