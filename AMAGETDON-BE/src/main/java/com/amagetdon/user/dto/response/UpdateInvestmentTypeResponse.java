package com.amagetdon.user.dto.response;

import com.amagetdon.user.entity.InvestmentType;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UpdateInvestmentTypeResponse {
    Long userId;
    private InvestmentType updatedType;
}