package com.amagetdon.common.jwt;

import io.jsonwebtoken.security.Keys;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
@ConfigurationProperties(prefix = "spring.jwt")
@Getter
@Setter
public class JwtProperties {
    private String secretKey;
    private long accessTokenExpirationMs;
    private long refreshTokenExpirationMs;

    public SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }
}
