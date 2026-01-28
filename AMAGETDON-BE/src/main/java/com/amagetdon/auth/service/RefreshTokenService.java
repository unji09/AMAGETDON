package com.amagetdon.auth.service;

import com.amagetdon.common.jwt.JwtProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RedisTemplate<Object, Object> redisTemplate;
    private final JwtProperties jwtProperties;

    public ResponseCookie createCookie(String refreshToken) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(jwtProperties.getRefreshTokenExpirationMs() / 1000) //Ms 단위를 S 단위로 변경
                .sameSite("Strict")
                .build();
    }

    public void save(String refreshToken, Long userId) {
        redisTemplate.opsForValue()
                .set(refreshToken, userId, jwtProperties.getRefreshTokenExpirationMs());
    }

    public boolean exists(String refreshToken) {
        return redisTemplate.hasKey(refreshToken);
    }

    public Long getUserId(String refreshToken) {
        return (Long) redisTemplate.opsForValue().get(refreshToken);
    }

    public void delete(String refreshToken) {
        redisTemplate.delete(refreshToken);
    }
}
