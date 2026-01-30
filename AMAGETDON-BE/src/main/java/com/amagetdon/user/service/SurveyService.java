package com.amagetdon.user.service;

import com.amagetdon.user.entity.Survey;
import com.amagetdon.user.repository.SurveyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SurveyService {

    private final SurveyRepository surveyRepository;

    public List<Survey> getAllSurveys() {
        return surveyRepository.findAll();
    }
}
