package com.amagetdon.user.entity;

public enum InvestmentType {
    AGGRESSIVE("공격형"),
    NEUTRAL("중립형"),
    STABLE("안정형");

    private final String description;

    InvestmentType(String description) {
        this.description = description;
    }
}