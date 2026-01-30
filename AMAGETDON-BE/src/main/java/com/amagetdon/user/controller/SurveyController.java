package com.amagetdon.user.controller;

import com.amagetdon.user.service.SurveyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/surveys")
public class SurveyController {

    private final SurveyService surveyService;

    @GetMapping
    public ResponseEntity<?> getSurveys() {
        return ResponseEntity.ok(surveyService.getAllSurveys());
    }

}
