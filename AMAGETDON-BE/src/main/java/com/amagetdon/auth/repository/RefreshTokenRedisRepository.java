package com.amagetdon.auth.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Repository;

import java.time.Duration;

@Repository
@RequiredArgsConstructor
public class RefreshTokenRedisRepository {
    private static final String KEY_PREFIX = "refresh:";

    private final StringRedisTemplate redisTemplate;

    private String key(Long userId) {
        return KEY_PREFIX + userId;
    }

    public void save(Long userId, String refreshToken, Duration ttl) {
        redisTemplate.opsForValue().set(key(userId), refreshToken, ttl);
    }

    public String find(Long userId) {
        return redisTemplate.opsForValue().get(key(userId));
    }

    public void delete(Long userId) {
        redisTemplate.delete(key(userId));
    }

    public boolean matches(Long userId, String refreshToken) {
        String stored = find(userId);
        return stored != null && stored.equals(refreshToken);
    }
}
