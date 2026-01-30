package com.amagetdon.stock.entity;

public enum IntervalType {
    M1("1m", "1분"),
    M5("5m", "5분"),
    M30("30m", "30분"),
    D1("1d", "1일"),
    W1("1w", "1주");

    private final String value;
    private final String description;

    IntervalType(String value, String description) {
        this.value = value;
        this.description = description;
    }

    public String getValue() {
        return value;
    }

    public String getDescription() {
        return description;
    }

    public static IntervalType fromValue(String value) {
        for (IntervalType type : values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new IllegalArgumentException("Unknown interval type: " + value);
    }
}