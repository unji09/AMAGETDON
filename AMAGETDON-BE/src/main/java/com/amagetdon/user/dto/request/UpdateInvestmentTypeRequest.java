package com.amagetdon.user.dto.request;

import com.amagetdon.user.entity.InvestmentType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateInvestmentTypeRequest {

    @NotNull(message = "투자 성향은 필수입니다")
    private InvestmentType investmentType;
}