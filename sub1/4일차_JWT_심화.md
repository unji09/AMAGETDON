# JWT 인증 보안 가이드 - Spring Boot & React 기반

## 개요

JWT(JSON Web Token) 인증 구현 시 반드시 고려해야 할 보안 이슈와 대응 방안을 정리한 문서입니다.
Django REST Framework와 Vue에서의 접근 방식과 비교하여 Spring Boot와 React 환경에서의 구현 방법을 제시합니다.

---

## 주요 보안 이슈 및 대응 방안

### 1. Algorithm None 취약점

**문제점**

- JWT 헤더의 `alg` 필드를 `none`으로 설정하여 서명 검증을 우회하는 공격
- 일부 구버전 라이브러리에서 `alg: none` 허용

**대응 방안**

- `alg: none` 요청을 명시적으로 거부
- 허용된 알고리즘만 화이트리스트 방식으로 검증 (예: HS256, RS256)
- 최신 JWT 라이브러리 사용 (대부분 기본 차단)

**Spring Boot 구현**

```java
// Django: SIMPLE_JWT 설정에서 알고리즘 지정
// SIMPLE_JWT = {'ALGORITHM': 'HS256'}

// Spring: JwtDecoder 설정으로 알고리즘 명시
@Bean
public JwtDecoder jwtDecoder() {
    SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
    return NimbusJwtDecoder.withSecretKey(key)
            .macAlgorithm(MacAlgorithm.HS256)  // 알고리즘 명시적 지정
            .build();
}
```

---

### 2. Payload 노출

**문제점**

- JWT는 Base64로 인코딩되어 있을 뿐 암호화되지 않음
- 누구나 디코딩하여 내용 확인 가능
- 민감 정보 포함 시 그대로 노출

**대응 방안**

- Payload에 민감 정보(비밀번호, 카드번호, 주민번호 등) 절대 포함 금지
- 사용자 식별에 필요한 최소 정보만 포함 (user_id, role 등)
- 필요 시 JWE(JSON Web Encryption) 사용 고려

**Spring Boot 구현**

```java
// Django: serializer로 claims 제한
// 'user_id': user.id, 'role': user.role

// Spring: Claims 구성 시 최소 정보만 포함
public String generateToken(UserDetails userDetails) {
    Map<String, Object> claims = new HashMap<>();
    claims.put("userId", user.getId());
    claims.put("role", user.getRole());
    // 민감 정보 절대 포함 금지

    return Jwts.builder()
            .setClaims(claims)
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + JWT_EXPIRATION))
            .signWith(getSigningKey(), SignatureAlgorithm.HS256)
            .compact();
}
```

---

### 3. Secret Key 관리

**문제점**

- 약한 Secret Key 사용 시 브루트포스 공격에 취약
- Secret Key 노출 시 토큰 위변조 가능
- 하드코딩된 Key는 소스 코드 유출 시 즉시 침해

**대응 방안**

#### 대칭키 알고리즘(HS256) 사용 시

- 충분히 긴 무작위 문자열 사용 (최소 256bit / 32자 이상 권장)
- Secret Key를 환경 변수 또는 Key Management Service(AWS KMS, Vault 등)에 저장
- 코드 저장소에 절대 포함 금지 (.gitignore 필수)

**Spring Boot 설정**

```yaml
# Django: settings.py 또는 .env
# SECRET_KEY=your-secret-key

# Spring: application.yml 또는 application.properties
# application.yml
jwt:
  secret: ${JWT_SECRET}  # 환경 변수에서 주입
  expiration: 900000     # 15분 (밀리초)
  refresh-expiration: 1209600000  # 2주

# application.properties
jwt.secret=${JWT_SECRET}
jwt.expiration=900000
jwt.refresh-expiration=1209600000
```

```java
@Component
@ConfigurationProperties(prefix = "jwt")
@Validated
public class JwtProperties {

    @NotBlank(message = "JWT secret must not be blank")
    @Size(min = 32, message = "JWT secret must be at least 32 characters")
    private String secret;

    @Positive
    private Long expiration;

    @Positive
    private Long refreshExpiration;

    // getters and setters
}
```

#### 비대칭키 알고리즘(RS256, ES256) 사용 시

- **Private Key**: 서버에서만 보관, 토큰 생성에 사용
- **Public Key**: 토큰 검증에 사용, 여러 서비스에 배포 가능
- Key 유출 시 영향 범위 최소화 가능
- MSA(Micro Service Architecture) 환경에서 권장
  - 각 서비스가 Public Key만으로 독립적으로 JWT 검증 가능
  - 인증 서비스에만 Private Key 보관

**Spring Boot RS256 구현**

```java
// Django: PyJWT에서 RS256 사용
// jwt.encode(payload, private_key, algorithm='RS256')

// Spring: RSA 키 페어로 토큰 생성/검증
@Configuration
public class RsaKeyConfig {

    @Value("classpath:keys/private_key.pem")
    private Resource privateKeyResource;

    @Value("classpath:keys/public_key.pem")
    private Resource publicKeyResource;

    @Bean
    public RSAPrivateKey privateKey() throws Exception {
        String key = new String(privateKeyResource.getInputStream().readAllBytes());
        key = key.replace("-----BEGIN PRIVATE KEY-----", "")
                 .replace("-----END PRIVATE KEY-----", "")
                 .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(key);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
        return (RSAPrivateKey) KeyFactory.getInstance("RSA")
                                         .generatePrivate(spec);
    }

    @Bean
    public RSAPublicKey publicKey() throws Exception {
        String key = new String(publicKeyResource.getInputStream().readAllBytes());
        key = key.replace("-----BEGIN PUBLIC KEY-----", "")
                 .replace("-----END PUBLIC KEY-----", "")
                 .replaceAll("\\s", "");

        byte[] decoded = Base64.getDecoder().decode(key);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
        return (RSAPublicKey) KeyFactory.getInstance("RSA")
                                        .generatePublic(spec);
    }

    @Bean
    public JwtDecoder jwtDecoder(RSAPublicKey publicKey) {
        return NimbusJwtDecoder.withPublicKey(publicKey).build();
    }
}
```

---

### 4. Token 탈취 대응

**문제점**

- JWT 탈취 시 만료 전까지 무제한 사용 가능
- Stateless 특성상 서버에서 즉시 무효화 불가능

**대응 방안**

#### 방안 1: HttpOnly Cookie 사용

- JavaScript에서 접근 불가능한 Cookie에 JWT 저장
- XSS(Cross-Site Scripting) 공격으로부터 보호

**Cookie 보안 속성 (각각 다른 위협 방어)**

- `HttpOnly=True`: JavaScript 접근 차단 (XSS 방어)
- `Secure=True`: HTTPS 연결에서만 Cookie 전송 (네트워크 도청 방어)
- `SameSite=Strict` 또는 `Lax`: 외부 사이트 요청 차단 (CSRF 방어)
- 운영 환경에서는 세 가지 모두 설정 필수

**Spring Boot 설정 예시**

```java
// Django: response.set_cookie()
// response.set_cookie('access_token', token, httponly=True, secure=True, samesite='Lax')

// Spring: ResponseCookie 사용
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Value("${app.environment}")
    private String environment;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, 
                                   HttpServletResponse response) {
        // 인증 처리...
        String accessToken = jwtService.generateToken(userDetails);

        // 개발/운영 환경에 따라 Cookie 속성 설정
        boolean isProduction = "production".equals(environment);

        ResponseCookie cookie = ResponseCookie.from("access_token", accessToken)
                .httpOnly(true)
                .secure(isProduction)  // 운영: true, 개발: false
                .path("/")
                .maxAge(Duration.ofMinutes(15))
                .sameSite(isProduction ? "Strict" : "Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        return ResponseEntity.ok(new LoginResponse("Login successful"));
    }
}
```

**application.yml 환경별 설정**

```yaml
# 개발 환경
spring:
  profiles: dev
app:
  environment: development

---
# 운영 환경
spring:
  profiles: prod
app:
  environment: production
```

**주의사항**

- Spring Security의 기본 CSRF 보호는 세션 기반 인증을 전제로 함
- JWT + Cookie 방식에서는 `SameSite` 속성으로 CSRF 방어 가능
- 구형 브라우저 지원이 필요하거나 추가 보안이 필요한 경우 CSRF 토큰 명시적 활성화

```java
// CSRF 보호 설정
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                // JWT 사용 시 일반적으로 비활성화하지만, 필요시 활성화
            )
            // 또는 JWT 사용 시 CSRF 비활성화
            .csrf(csrf -> csrf.disable());

        return http.build();
    }
}
```

#### 방안 2: Token Blacklist 관리

- 로그아웃, 비밀번호 변경, 의심 토큰을 Blacklist(Redis 등)에 등록
- 토큰 검증 시 Blacklist 확인 후 거부

**Spring Boot + Redis 구현**

```java
// Django: Redis를 사용한 Blacklist
// cache.set(f'blacklist_{token_id}', 'true', timeout=remaining_time)

// Spring: Redis를 사용한 Blacklist 관리
@Service
public class TokenBlacklistService {

    @Autowired
    private RedisTemplate<String, String> redisTemplate;

    @Autowired
    private JwtService jwtService;

    public void blacklistToken(String token) {
        String jti = jwtService.getTokenId(token);
        Date expiration = jwtService.getExpirationDate(token);
        long ttl = expiration.getTime() - System.currentTimeMillis();

        if (ttl > 0) {
            redisTemplate.opsForValue().set(
                "blacklist:" + jti, 
                "true", 
                Duration.ofMillis(ttl)
            );
        }
    }

    public boolean isBlacklisted(String token) {
        String jti = jwtService.getTokenId(token);
        return Boolean.TRUE.equals(
            redisTemplate.hasKey("blacklist:" + jti)
        );
    }
}

// JWT Filter에서 Blacklist 확인
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private TokenBlacklistService blacklistService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) 
            throws ServletException, IOException {

        String token = extractToken(request);

        if (token != null && !blacklistService.isBlacklisted(token)) {
            // 토큰 검증 및 인증 처리
        }

        filterChain.doFilter(request, response);
    }
}
```

**장점**

- 토큰 즉시 무효화 가능

**단점**

- JWT의 Stateless 장점 상실
- Redis 조회 부하 발생
- 확장성 저하

#### 방안 3: 짧은 만료 시간 + Refresh Token (권장)

**구조**

- **Access Token**: 짧은 만료 시간 (5분~1시간), 실제 API 인증에 사용
- **Refresh Token**: 긴 만료 시간 (1주~1개월), Access Token 재발급에만 사용
- Refresh Token은 서버 DB/캐시에 저장 (Hash 처리 권장)

**Refresh Token Rotation**

- Refresh Token 1회 사용 후 새로운 토큰으로 자동 교체
- 재사용 감지 시 해당 사용자의 모든 Refresh Token 무효화
- 토큰 탈취 후 공격자와 정상 사용자가 동시 사용 시 감지 가능

**흐름**

```
1. 로그인 → Access Token(15분) + Refresh Token(2주) 발급
2. API 요청 → Access Token으로 인증
3. Access Token 만료 → Refresh Token으로 재발급 요청
4. 새 Access Token + 새 Refresh Token 발급 (기존 Refresh Token 무효화)
```

**Spring Boot 구현**

```java
// Django: RefreshToken 모델 + rotation 로직
// RefreshToken.objects.create(user=user, token=hashed_token)

// Spring: Entity 정의
@Entity
@Table(name = "refresh_tokens")
public class RefreshToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;  // Hash 처리된 토큰

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    @Column(nullable = false)
    private boolean used = false;  // Rotation 감지용

    // getters, setters, constructors
}

// Service 구현
@Service
public class RefreshTokenService {

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;  // Hash용

    @Autowired
    private JwtService jwtService;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // 기존 토큰 모두 삭제 (Optional: 여러 디바이스 허용 시 생략)
        refreshTokenRepository.deleteByUser(user);

        String tokenValue = UUID.randomUUID().toString();
        String hashedToken = passwordEncoder.encode(tokenValue);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(hashedToken);
        refreshToken.setUser(user);
        refreshToken.setExpiryDate(LocalDateTime.now().plusDays(14));

        refreshTokenRepository.save(refreshToken);

        return refreshToken;
    }

    @Transactional
    public TokenResponse rotateRefreshToken(String tokenValue) {
        // 모든 토큰 조회 (Hash 비교 필요)
        List<RefreshToken> tokens = refreshTokenRepository
            .findByUserAndExpiryDateAfter(user, LocalDateTime.now());

        RefreshToken validToken = tokens.stream()
            .filter(t -> passwordEncoder.matches(tokenValue, t.getToken()))
            .findFirst()
            .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        // 재사용 감지
        if (validToken.isUsed()) {
            // 해당 사용자의 모든 토큰 무효화
            refreshTokenRepository.deleteByUser(validToken.getUser());
            throw new SecurityException("Refresh token reuse detected");
        }

        // 사용 표시
        validToken.setUsed(true);
        refreshTokenRepository.save(validToken);

        // 새 토큰 생성
        User user = validToken.getUser();
        String newAccessToken = jwtService.generateToken(user);
        RefreshToken newRefreshToken = createRefreshToken(user);

        return new TokenResponse(newAccessToken, newRefreshToken.getToken());
    }
}

// Controller
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(
            @CookieValue(name = "refresh_token", required = false) String refreshToken,
            HttpServletResponse response) {

        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Refresh token is missing");
        }

        try {
            TokenResponse tokens = refreshTokenService.rotateRefreshToken(refreshToken);

            // Access Token을 Cookie에 설정
            ResponseCookie accessCookie = ResponseCookie
                .from("access_token", tokens.getAccessToken())
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(Duration.ofMinutes(15))
                .sameSite("Strict")
                .build();

            // Refresh Token을 Cookie에 설정
            ResponseCookie refreshCookie = ResponseCookie
                .from("refresh_token", tokens.getRefreshToken())
                .httpOnly(true)
                .secure(true)
                .path("/api/auth/refresh")  // Refresh 엔드포인트에만 전송
                .maxAge(Duration.ofDays(14))
                .sameSite("Strict")
                .build();

            response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());

            return ResponseEntity.ok(new MessageResponse("Token refreshed successfully"));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid refresh token");
        }
    }
}
```

---

## 추가 보안 고려사항

### XSS(Cross-Site Scripting) 방어

**문제점**

- LocalStorage에 JWT 저장 시 XSS 공격으로 토큰 탈취 가능

**대응 방안**

- HttpOnly Cookie 사용 (권장)
- CSP(Content Security Policy) 헤더 설정
- 사용자 입력값 sanitization

**Spring Boot CSP 설정**

```java
// Django: SecurityMiddleware 설정
// SECURE_CONTENT_SECURITY_POLICY = "default-src 'self'"

// Spring: Security Headers 설정
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .headers(headers -> headers
                .contentSecurityPolicy(csp -> csp
                    .policyDirectives(
                        "default-src 'self'; " +
                        "script-src 'self' 'unsafe-inline' https://trusted-cdn.com; " +
                        "style-src 'self' 'unsafe-inline'; " +
                        "img-src 'self' data: https:; " +
                        "font-src 'self' data:; " +
                        "connect-src 'self' https://api.example.com"
                    )
                )
                .xssProtection(xss -> xss.headerValue("1; mode=block"))
                .frameOptions(frame -> frame.deny())
            );

        return http.build();
    }
}
```

### CSRF(Cross-Site Request Forgery) 방어

**문제점**

- Cookie 기반 인증 시 CSRF 공격 가능

**대응 방안**

- SameSite Cookie 속성 사용 (Strict 또는 Lax)
- 필요 시 CSRF Token 추가 검증
- Custom Header 방식 (예: `X-Requested-With`)

**Spring Boot CSRF 설정**

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                // JWT 사용 시 일반적으로 비활성화
                .disable()
                // 또는 특정 엔드포인트만 CSRF 보호
                // .ignoringRequestMatchers("/api/auth/**")
            );

        return http.build();
    }
}
```

### 통신 암호화

- 운영 환경에서 HTTPS 필수
- 모든 JWT 전송은 암호화된 연결을 통해서만 수행
- 중간자 공격(Man-in-the-Middle) 방어

**application.yml HTTPS 설정**

```yaml
server:
  port: 8443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: ${SSL_KEYSTORE_PASSWORD}
    key-store-type: PKCS12
    key-alias: tomcat
```

---

## JWT 저장 방식 선택 가이드

### Authorization Header (가장 일반적)

**React 구현**

```javascript
// Vue: localStorage 사용
// localStorage.setItem('access_token', token)

// React: localStorage + axios interceptor
import axios from 'axios';

// 토큰 저장
localStorage.setItem('access_token', token);

// axios 인스턴스 생성
const api = axios.create({
  baseURL: 'http://localhost:8080/api'
});

// Request interceptor: 모든 요청에 토큰 자동 추가
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// API 호출
api.get('/data')
  .then(response => console.log(response.data))
  .catch(error => console.error(error));
```

**Spring Boot 검증**

```java
// Django: Bearer 토큰 자동 추출
// REST_FRAMEWORK = {'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework_simplejwt.authentication.JWTAuthentication']}

// Spring: JWT Filter
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response, 
                                   FilterChain filterChain) 
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String jwt = authHeader.substring(7);
        final String username = jwtService.extractUsername(jwt);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = 
                    new UsernamePasswordAuthenticationToken(
                        userDetails, 
                        null, 
                        userDetails.getAuthorities()
                    );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }
}
```

**적합한 경우**

- 단순한 프로젝트, 내부 서비스
- SPA(Single Page Application)
- CORS 설정이 필요한 경우

**장점**: CSRF 걱정 없음, 구현 간단  
**단점**: XSS에 취약  
**보완**: CSP 헤더로 XSS 방어

### HttpOnly Cookie (보안 중요 시)

**React 구현**

```javascript
// Vue: axios credentials 설정
// axios.defaults.withCredentials = true

// React: axios credentials 설정
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true  // Cookie 자동 전송
});

// 로그인
api.post('/auth/login', { username, password })
  .then(response => {
    // Cookie는 자동으로 저장됨
    console.log('Login successful');
  });

// API 호출 (Cookie 자동 전송)
api.get('/data')
  .then(response => console.log(response.data));
```

**Spring Boot CORS 설정**

```java
// Django: CORS_ALLOW_CREDENTIALS = True
// CORS_ALLOWED_ORIGINS = ['http://localhost:3000']

// Spring: CORS 설정
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins("http://localhost:3000")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)  // Cookie 허용
                .maxAge(3600);
    }
}
```

**적합한 경우**

- 보안이 중요한 서비스
- 금융, 의료 등 민감 정보 취급

**장점**: XSS 방어, CSRF도 SameSite로 방어 가능  
**단점**: 구현 복잡도 증가, CORS 설정 필요

---

## React에서 Token Refresh 자동화

**React + axios interceptor 구현**

```javascript
// Vue: axios response interceptor로 401 처리
// axios.interceptors.response.use(response => response, async error => {...})

// React: Token refresh 자동화
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  withCredentials: true
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: Access Token 만료 시 자동 갱신
api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 갱신 중이면 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh Token으로 새 Access Token 요청
        await api.post('/auth/refresh');

        processQueue(null);
        isRefreshing = false;

        // 원래 요청 재시도
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        // Refresh 실패 시 로그인 페이지로 이동
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

**React Context로 인증 상태 관리**

```javascript
// Vue: Vuex store로 인증 상태 관리
// store.dispatch('login', credentials)

// React: Context API로 인증 상태 관리
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 초기 로드 시 사용자 정보 확인
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 라이브러리 사용 시 주의사항

### Spring Boot 주요 라이브러리

```xml
<!-- Maven pom.xml -->
<dependencies>
    <!-- JWT -->
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

    <!-- Spring Security -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>

    <!-- Redis (Optional - Blacklist용) -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-redis</artifactId>
    </dependency>
</dependencies>
```

```gradle
// Gradle build.gradle
dependencies {
    // JWT
    implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.11.5'
    runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.11.5'

    // Spring Security
    implementation 'org.springframework.boot:spring-boot-starter-security'

    // Redis (Optional)
    implementation 'org.springframework.boot:spring-boot-starter-data-redis'
}
```

### React 주요 라이브러리

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  }
}
```

**중요**: 위 라이브러리는 JWT 생성/검증 기능만 제공

**개발자가 직접 구현해야 할 보안 정책**

- 알고리즘 화이트리스트 검증
- Token 저장 방식 (Cookie vs LocalStorage)
- Refresh Token 로직
- Blacklist 관리
- 만료 시간 정책
- Cookie 보안 속성 설정
- CORS 설정
- React에서 Token refresh 자동화

---

## 구현 체크리스트

### 필수 사항

- [ ] `alg: none` 명시적 거부 확인 (JwtDecoder 설정)
- [ ] Secret Key 환경 변수 분리 (application.yml + 환경변수)
- [ ] Payload에 민감 정보 미포함 검증
- [ ] 운영 환경 HTTPS 적용 (SSL 설정)
- [ ] Access Token 만료 시간 1시간 이하 설정
- [ ] Cookie 사용 시: HttpOnly + Secure + SameSite 속성 설정 (ResponseCookie)
- [ ] CORS 설정 (allowCredentials, allowedOrigins)

### 권장 사항

- [ ] Refresh Token 구현 (Entity + Repository + Service)
- [ ] Refresh Token Rotation 적용 (재사용 감지)
- [ ] 비대칭키 알고리즘(RS256) 검토 (MSA 환경)
- [ ] 로그아웃 시 Refresh Token 무효화
- [ ] 비밀번호 변경 시 모든 토큰 무효화
- [ ] 토큰 발급/갱신 로그 기록 (AOP 활용)
- [ ] CSP 헤더 설정 (XSS 추가 방어)
- [ ] React axios interceptor 구현 (Token refresh 자동화)
- [ ] React Context API로 인증 상태 관리

---

## Django/Vue vs Spring/React 주요 차이점 요약

| 항목               | Django/Vue                           | Spring Boot/React                       |
| ---------------- | ------------------------------------ | --------------------------------------- |
| JWT 라이브러리        | PyJWT, djangorestframework-simplejwt | jjwt (io.jsonwebtoken)                  |
| 설정 파일            | settings.py, .env                    | application.yml, application.properties |
| Secret Key 주입    | os.environ.get('SECRET_KEY')         | @Value("${jwt.secret}")                 |
| Cookie 설정        | response.set_cookie()                | ResponseCookie.from()                   |
| 인증 필터            | DRF Authentication 클래스               | OncePerRequestFilter 상속                 |
| Refresh Token 저장 | Django ORM Model                     | JPA Entity                              |
| Blacklist 관리     | Django Cache Framework               | Spring Data Redis                       |
| CORS 설정          | django-cors-headers                  | WebMvcConfigurer                        |
| 프론트 HTTP 클라이언트   | axios (Vue)                          | axios (React)                           |
| 상태 관리            | Vuex, Pinia                          | Context API, Redux                      |
| Token 자동 갱신      | axios interceptor (Vue)              | axios interceptor (React)               |

---

## 참고 자료

- [RFC 7519: JSON Web Token (JWT)](https://tools.ietf.org/html/rfc7519)
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [JWT.io - Debugger & Libraries](https://jwt.io/)
- [Spring Security Documentation](https://docs.spring.io/spring-security/reference/index.html)
- [Spring Boot JWT Tutorial](https://www.bezkoder.com/spring-boot-jwt-authentication/)
- [React Authentication Best Practices](https://blog.logrocket.com/jwt-authentication-best-practices/)
- [Axios Interceptors Guide](https://axios-http.com/docs/interceptors)


