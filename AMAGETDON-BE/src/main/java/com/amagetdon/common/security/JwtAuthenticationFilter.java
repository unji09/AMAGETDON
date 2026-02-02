package com.amagetdon.common.security;

import com.amagetdon.common.jwt.JwtTokenProvider;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getRequestURI();
        // 로그인, 회원가입 API는 필터링하지 않음
        return path.startsWith("/oauth")
                || path.startsWith("/auth")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/api-docs");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);

        if (token != null) {
            if (jwtTokenProvider.validateToken(token)) {
                Long userId = jwtTokenProvider.getUserId(token);

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userId,
                                null,
                                Collections.emptyList()
                        );

                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else if (jwtTokenProvider.isTokenExpired(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"error\":\"TOKEN_EXPIRED\",\"message\":\"액세스 토큰이 만료되었습니다.\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
