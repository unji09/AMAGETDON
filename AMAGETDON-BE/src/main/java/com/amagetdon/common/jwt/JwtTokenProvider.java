package com.amagetdon.common.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    public JwtTokenProvider(JwtProperties jwtProperties) {
        this.jwtProperties = jwtProperties;
    }

    private SecretKey getSecretKey() {
        return jwtProperties.getSigningKey();
    }

    public String createAccessToken(Long userId) {
        return createToken(userId, JwtTokenType.ACCESS,jwtProperties.getAccessTokenExpirationMs());
    }

    public String createRefreshToken(Long userId) {
        return createToken(userId, JwtTokenType.REFRESH, jwtProperties.getRefreshTokenExpirationMs());
    }

    public String createToken(Long userId, JwtTokenType tokenType, long expirationMs) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claim("userId", userId)
                .claim("tokenType", tokenType.name())
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(getSecretKey(), SignatureAlgorithm.HS256)
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

    public boolean isTokenExpired(String token) {
        try {
            parseClaims(token);
            return false;
        } catch (Exception e) {
            return true;
        }
    }

    public Long getUserId(String token) {
        return parseClaims(token).get("userId", Long.class);
    }

    public Long getUserIdIgnoringExpiration(String token) {
        try {
            return parseClaims(token).get("userId", Long.class);
        } catch (ExpiredJwtException e) {
            return e.getClaims().get("userId", Long.class);
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSecretKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }


}
