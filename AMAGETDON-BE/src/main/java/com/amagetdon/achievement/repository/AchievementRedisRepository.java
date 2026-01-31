package com.amagetdon.achievement.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AchievementRedisRepository {

    private final StringRedisTemplate redisTemplate;

    private static final String KEY_PREFIX = "achievement:user:";

    private String buildKey(Long userId, String conditionKey) {
        return KEY_PREFIX + userId + ":" + conditionKey;
    }

    public Long getValue(Long userId, String conditionKey) {
        String value = redisTemplate.opsForValue().get(buildKey(userId, conditionKey));
        return value != null ? Long.parseLong(value) : 0L;
    }

    public Long increment(Long userId, String conditionKey) {
        return redisTemplate.opsForValue().increment(buildKey(userId, conditionKey));
    }

    public void setValue(Long userId, String conditionKey, Long value) {
        redisTemplate.opsForValue().set(buildKey(userId, conditionKey), String.valueOf(value));
    }

    public boolean setFlagIfAbsent(Long userId, String conditionKey) {
        return Boolean.TRUE.equals(
                redisTemplate.opsForValue().setIfAbsent(buildKey(userId, conditionKey), "1")
        );
    }
}
