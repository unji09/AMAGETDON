package com.amagetdon.stock.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class IntervalTypeConverter implements AttributeConverter<IntervalType, String> {

    @Override
    public String convertToDatabaseColumn(IntervalType attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }

    @Override
    public IntervalType convertToEntityAttribute(String dbData) {
        if (dbData == null) {
            return null;
        }
        return IntervalType.fromValue(dbData);
    }
}
