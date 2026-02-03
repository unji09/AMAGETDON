package com.amagetdon.user.service;

import com.amagetdon.common.ErrorCode;
import com.amagetdon.common.security.SecurityUtil;
import com.amagetdon.user.entity.InvestmentType;
import com.amagetdon.user.entity.Survey;
import com.amagetdon.user.entity.User;
import com.amagetdon.user.repository.SurveyRepository;
import com.amagetdon.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class SurveyService {

    private final SurveyRepository surveyRepository;
    private final UserRepository userRepository;

    public List<Survey> getAllSurveys() {
        return surveyRepository.findAll();
    }

    public InvestmentType submitSurvey(int score) {
        Long userId = SecurityUtil.getCurrentUserId();

        InvestmentType result;

        if(score<=10){
            result = InvestmentType.STABLE;
        }else if(score>=15){
            result = InvestmentType.AGGRESSIVE;
        }else {
            result = InvestmentType.NEUTRAL;
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(ErrorCode.USER_NOT_FOUND_SIMPLE.getMessage()));

        user.updateInvestmentType(result);

        return result;
    }
}
