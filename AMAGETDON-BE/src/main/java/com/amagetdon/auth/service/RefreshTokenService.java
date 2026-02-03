package com.amagetdon.auth.service;

import com.amagetdon.common.jwt.JwtProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private static final String REFRESH_KEY_PREFIX = "refresh:";

    private final RedisTemplate<Object, Object> redisTemplate;
    private final JwtProperties jwtProperties;

    @Value("${cookie.secure:true}")
    private boolean cookieSecure;

    @Value("${cookie.same-site:Lax}")
    private String cookieSameSite;

    private String refreshKey(Long userId) {
        return REFRESH_KEY_PREFIX + userId;
    }

    public void saveRefreshToken(Long userID, String refreshToken) {
        redisTemplate.opsForValue()
                .set(refreshKey(userID), refreshToken, jwtProperties.getRefreshTokenExpirationMs()/1000, TimeUnit.SECONDS);
    }

    public String validateAndExtractUserId(String token) {
        try {
            // 1. JWT 서명 및 만료일 검증
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(jwtProperties.getSigningKey()) // getSecretKey().getBytes() 대신 사용
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            Long userId = claims.get("userId", Long.class);
            if (userId == null) {
                throw new SecurityException("토큰에 유저 정보가 포함되어 있지 않습니다.");
            }

            String userIdStr = String.valueOf(userId);
            String key = refreshKey(userId);

            Object storedTokenObj = redisTemplate.opsForValue().get(key);
            String storedToken = (storedTokenObj != null) ? storedTokenObj.toString() : null;

            // Redis 직렬화 따옴표 방어 코드
            if (storedToken != null && storedToken.startsWith("\"") && storedToken.endsWith("\"")) {
                storedToken = storedToken.substring(1, storedToken.length() - 1);
            }

            if (storedToken == null || !storedToken.equals(token)) {
                throw new SecurityException("로그인 정보가 일치하지 않거나 이미 로그아웃된 계정입니다.");
            }

            return userIdStr;
        } catch (ExpiredJwtException e) {
            throw new SecurityException("토큰이 만료되었습니다. 다시 로그인해주세요.");
        } catch (Exception e) {
            throw new SecurityException("유효하지 않은 토큰입니다.");
        }
    }

    public void deleteRefreshTokenByUserId(Long userId) {
        redisTemplate.delete(refreshKey(userId));
    }

    public ResponseCookie createRefreshTokenCookie(String refreshToken) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(jwtProperties.getRefreshTokenExpirationMs() / 1000)
                .sameSite(cookieSameSite)
                .build();
    }

    public ResponseCookie deleteRefreshTokenCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(cookieSecure)
                .path("/")
                .maxAge(0)
                .sameSite(cookieSameSite)
                .build();
    }
}
