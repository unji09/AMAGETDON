package com.amagetdon.common.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final JwtProperties jwtProperites;
    private final SecretKey secretKey;

    public JwtTokenProvider(JwtProperties jwtProperties, SecretKey secretKey) {
        this.jwtProperites = jwtProperties;
        this.secretKey = Keys.hmacShaKeyFor(
                jwtProperties.getSecretKey().getBytes(StandardCharsets.UTF_8)
        );
    }

    public String createAccessToken(Long userId) {
        return createToken(userId, TokenType.ACCESS,jwtProperites.getAccessTokenExpirationMs());
    }

    public String createRefreshToken(Long userId) {
        return createToken(userId, TokenType.REFRESH, jwtProperites.getRefreshTokenExpirationMs());
    }

    public String createToken(Long userId, TokenType tokenType, long expirationMs) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claim("userId", userId)
                .claim("tokenType", tokenType.name())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(secretKey, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public Long getUserId(String token) {
        return parseClaims(token).get("userId", Long.class);
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }


}
