# JWT 토큰 관리 전략

## 1. 주제 선정 배경

### 1.1 학습 필요성

카카오 로그인 후 우리 서비스만의 독립적인 인증 체계가 필요합니다:

- 카카오 API 의존성 감소 (매번 카카오 서버 검증 불필요)
- Stateless 아키텍처로 서버 확장성 확보
- 사용자 권한 정보를 토큰에 포함하여 빠른 인가 처리

### 1.2 프로젝트 문제 해결

- **세션 관리 복잡성:** 서버 확장 시 세션 동기화 문제 해결
- **금융 서비스 보안:** 짧은 만료 시간 + Refresh Token으로 보안 강화
- **권한 관리:** 일반 사용자, 프리미엄 사용자, 관리자 구분

## 2. 개념 설명

### 2.1 JWT 구조

```
Header.Payload.Signature

예시:
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0IiwibmFtZSI6IkpvaG4iLCJpYXQiOjE1MTYyMzkwMjJ9.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

**Header:** 알고리즘 정보

```json
{"alg": "HS256", "typ": "JWT"}
```

**Payload:** 사용자 정보 (Claim)

```json
{
  "sub": "kakao_123456789",
  "email": "user@example.com",
  "role": "ROLE_USER",
  "iat": 1704960000,
  "exp": 1704963600
}
```

**Signature:** 위변조 방지 서명

### 2.2 Access Token vs Refresh Token

| 구분        | Access Token  | Refresh Token    |
| --------- | ------------- | ---------------- |
| **만료 시간** | 1시간           | 7일               |
| **저장 위치** | LocalStorage  | HttpOnly Cookie  |
| **용도**    | API 호출 인증     | Access Token 재발급 |
| **보안**    | 짧은 만료로 위험 최소화 | XSS 공격 방어        |

**토큰 갱신 흐름:**

```
Access Token 만료 감지
    ↓
POST /api/auth/refresh (Refresh Token 전송)
    ↓
새 Access Token 발급
    ↓
원래 요청 재시도
```

## 3. Spring Boot 구현

### 3.1 의존성 설정

```xml
<!-- pom.xml -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.11.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.11.5</version>
    <scope>runtime</scope>
</dependency>
```

### 3.2 설정 파일

```yaml
# application.yml
jwt:
  secret: your-base64-encoded-secret-key-min-256-bits
  access-token-validity: 3600000 # 1시간
  refresh-token-validity: 604800000 # 7일
```

### 3.3 JWT 유틸리티 클래스

```java
@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.access-token-validity}")
    private long accessTokenValidity;

    @Value("${jwt.refresh-token-validity}")
    private long refreshTokenValidity;

    private Key key;

    @PostConstruct
    protected void init() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        this.key = Keys.hmacShaKeyFor(keyBytes);
    }

    // Access Token 생성
    public String createAccessToken(User user) {
        Claims claims = Jwts.claims().setSubject(user.getId().toString());
        claims.put("email", user.getEmail());
        claims.put("role", user.getRole().name());

        Date now = new Date();
        Date validity = new Date(now.getTime() + accessTokenValidity);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // Refresh Token 생성
    public String createRefreshToken(User user) {
        Claims claims = Jwts.claims().setSubject(user.getId().toString());
        Date now = new Date();
        Date validity = new Date(now.getTime() + refreshTokenValidity);

        return Jwts.builder()
                .setClaims(claims)
                .setIssuedAt(now)
                .setExpiration(validity)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    // 토큰에서 사용자 ID 추출
    public Long getUserIdFromToken(String token) {
        return Long.parseLong(
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject()
        );
    }

    // 토큰 유효성 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
```

### 3.4 Refresh Token 엔티티

```java
@Entity
@Table(name = "refresh_tokens")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long userId;

    @Column(nullable = false, length = 500)
    private String token;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryDate);
    }
}

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUserId(Long userId);
    void deleteByUserId(Long userId);
}
```

### 3.5 토큰 서비스

```java
@Service
@Transactional
@RequiredArgsConstructor
public class TokenService {

    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    // Access Token + Refresh Token 발급
    public TokenResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user);
        String refreshToken = jwtTokenProvider.createRefreshToken(user);

        // 기존 Refresh Token 삭제
        refreshTokenRepository.deleteByUserId(user.getId());

        // 새 Refresh Token 저장
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .userId(user.getId())
                .token(refreshToken)
                .expiryDate(LocalDateTime.now().plusDays(7))
                .build();

        refreshTokenRepository.save(refreshTokenEntity);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(3600)
                .build();
    }

    // Access Token 재발급
    public TokenResponse refreshAccessToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new InvalidTokenException("유효하지 않은 Refresh Token입니다.");
        }

        RefreshToken tokenEntity = refreshTokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new InvalidTokenException("Refresh Token을 찾을 수 없습니다."));

        if (tokenEntity.isExpired()) {
            refreshTokenRepository.delete(tokenEntity);
            throw new ExpiredTokenException("만료된 Refresh Token입니다.");
        }

        User user = userRepository.findById(tokenEntity.getUserId())
                .orElseThrow(() -> new UserNotFoundException("사용자를 찾을 수 없습니다."));

        String newAccessToken = jwtTokenProvider.createAccessToken(user);

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .tokenType("Bearer")
                .expiresIn(3600)
                .build();
    }

    // 로그아웃
    public void logout(Long userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }
}
```

### 3.6 인증 컨트롤러

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final TokenService tokenService;
    private final KakaoOAuthService kakaoOAuthService;
    private final UserService userService;

    // 카카오 로그인
    @PostMapping("/kakao/login")
    public ResponseEntity<TokenResponse> kakaoLogin(
            @RequestBody KakaoLoginRequest request,
            HttpServletResponse response) {

        String kakaoAccessToken = kakaoOAuthService.getAccessToken(request.getCode());
        KakaoUserInfo kakaoUserInfo = kakaoOAuthService.getUserInfo(kakaoAccessToken);
        User user = userService.processKakaoLogin(kakaoUserInfo);

        TokenResponse tokenResponse = tokenService.issueTokens(user);

        // Refresh Token을 HttpOnly Cookie에 저장
        Cookie cookie = new Cookie("refreshToken", tokenResponse.getRefreshToken());
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        response.addCookie(cookie);

        return ResponseEntity.ok(
            TokenResponse.builder()
                .accessToken(tokenResponse.getAccessToken())
                .tokenType(tokenResponse.getTokenType())
                .expiresIn(tokenResponse.getExpiresIn())
                .build()
        );
    }

    // Access Token 재발급
    @PostMapping("/refresh")
    public ResponseEntity<TokenResponse> refresh(
            @CookieValue(name = "refreshToken") String refreshToken) {

        TokenResponse tokenResponse = tokenService.refreshAccessToken(refreshToken);
        return ResponseEntity.ok(tokenResponse);
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @AuthenticationPrincipal UserPrincipal userPrincipal,
            HttpServletResponse response) {

        tokenService.logout(userPrincipal.getId());

        Cookie cookie = new Cookie("refreshToken", null);
        cookie.setMaxAge(0);
        cookie.setPath("/");
        response.addCookie(cookie);

        return ResponseEntity.ok().build();
    }
}
```

### 3.7 JWT 인증 필터

```java
@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String token = resolveToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(userId.toString());

            UsernamePasswordAuthenticationToken authentication = 
                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
```

### 3.8 Security Configuration

```java
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().disable()
            .sessionManagement()
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            .and()
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

## 4. React 프론트엔드 구현

### 4.1 Axios 인스턴스 설정

```javascript
// src/api/axios.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true // Cookie 전송
});

// Request: Access Token 추가
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

// Response: 401 에러 시 토큰 갱신
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh Token으로 새 Access Token 발급
        const response = await axios.post(
          'http://localhost:8080/api/auth/refresh',
          {},
          { withCredentials: true }
        );

        const newToken = response.data.accessToken;
        localStorage.setItem('accessToken', newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login?session=expired';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
```

### 4.2 인증 Context

```javascript
// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axiosInstance from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axiosInstance.get('/user/me');
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (code) => {
    try {
      const response = await axiosInstance.post('/auth/kakao/login', { code });
      localStorage.setItem('accessToken', response.data.accessToken);
      await checkAuth();
      return true;
    } catch (error) {
      return false;
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

### 4.3 Protected Route

```javascript
// src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;
```

### 4.4 카카오 콜백

```javascript
// src/pages/KakaoCallback.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const KakaoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');

    if (code) {
      handleLogin(code);
    }
  }, []);

  const handleLogin = async (code) => {
    const success = await login(code);
    navigate(success ? '/' : '/login?error=login_failed');
  };

  return <div>로그인 처리 중...</div>;
};

export default KakaoCallback;
```

## 5. 적용 방안

### 5.1 구현 순서

**Step 1: JWT 기본**

- JwtTokenProvider 구현
- TokenResponse DTO 작성
- application.yml 설정

**Step 2: 토큰 발급**

- AuthController 카카오 로그인 수정
- TokenService 작성
- 테스트 (Postman)

**Step 3: Spring Security**

- JwtAuthenticationFilter 작성
- SecurityConfig 설정
- UserDetailsService 구현

**Step 4: Refresh Token**

- RefreshToken 엔티티 작성
- 재발급 로직 구현
- HttpOnly Cookie 설정

**Step 5: React 연동**

- Axios 인터셉터 구현
- AuthContext 작성
- ProtectedRoute 구현

### 5.2 테스트 체크리스트

- [ ] 카카오 로그인 후 Access Token 발급 확인
- [ ] API 호출 시 Authorization 헤더 자동 추가
- [ ] Access Token 만료 시 자동 갱신
- [ ] 로그아웃 시 Refresh Token 삭제
- [ ] Protected Route에서 미인증 사용자 리다이렉트

## 6. 느낀 점

JWT는 **Stateless 아키텍처의 핵심**입니다. 카카오 로그인과 결합하면:

- 사용자: 간편한 로그인 + 7일간 로그인 유지
- 개발자: 서버 확장 가능 + 카카오 API 의존성 감소

**주의사항:**

- Access Token은 LocalStorage (짧은 만료로 위험 최소화)
- Refresh Token은 HttpOnly Cookie (XSS 방어)
- HTTPS 환경에서만 운영 (토큰 탈취 방지)
