package com.amagetdon.transaction.entity;

public enum TransactionType {
    BUY("매수"),
    SELL("매도");

    public final String description;

    TransactionType(String description) {
        this.description = description;
    }
}
