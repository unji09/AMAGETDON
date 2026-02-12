# 카카오 로그인 (OAuth 2.0) 학습 노트

## 1. 주제 선정 배경

### 1.1 학습 필요성
사회 초년생 대상 금융 서비스는 사용자 진입 장벽을 최소화해야 합니다. 카카오 로그인을 도입하면:
- 회원가입 절차를 간소화하여 이탈률 감소
- 이메일 인증, 비밀번호 관리 등의 부담 제거
- 카카오톡 사용자 기반(국내 95% 이상)을 활용한 빠른 온보딩

### 1.2 프로젝트 문제 해결
- **사용자 인증 복잡성:** 자체 회원가입/로그인 시스템 구축 대비 개발 및 유지보수 비용 절감
- **신뢰도 확보:** 카카오라는 검증된 플랫폼을 통한 사용자 신뢰 획득
- **추가 데이터 활용:** 프로필 정보(닉네임, 프로필 이미지)를 활용한 개인화 서비스 제공 가능

## 2. 개념 설명

### 2.1 OAuth 2.0 기본 개념

OAuth 2.0은 리소스 소유자(사용자)의 권한을 제3자 애플리케이션에 위임하는 표준 프로토콜입니다.

**주요 구성 요소:**
- **Resource Owner:** 사용자
- **Client:** 우리 서비스 (금융 학습 플랫폼)
- **Authorization Server:** 카카오 인증 서버
- **Resource Server:** 카카오 API 서버 (사용자 정보 제공)

### 2.2 카카오 로그인 인증 흐름

```
[사용자] → [우리 서비스] → [카카오 로그인 화면]
                ↓
        [사용자 동의]
                ↓
[카카오] → [Authorization Code] → [우리 서비스]
                ↓
        [Access Token 요청]
                ↓
[카카오] → [Access Token] → [우리 서비스]
                ↓
        [사용자 정보 API 호출]
                ↓
[카카오] → [사용자 정보] → [우리 서비스]
                ↓
        [세션/JWT 발급]
```

#### 2.2.1 Authorization Code Grant 방식

카카오 로그인은 Authorization Code Grant 방식을 사용합니다. 가장 안전한 방식으로, 서버 간 통신으로 토큰을 교환합니다.

**단계별 상세:**

1. **인가 코드 요청**
```
GET https://kauth.kakao.com/oauth/authorize
?client_id={REST_API_KEY}
&redirect_uri={REDIRECT_URI}
&response_type=code
```

2. **사용자 동의 후 Redirect**
```
{REDIRECT_URI}?code={AUTHORIZATION_CODE}
```

3. **토큰 발급 요청**
```http
POST https://kauth.kakao.com/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&client_id={REST_API_KEY}
&redirect_uri={REDIRECT_URI}
&code={AUTHORIZATION_CODE}
```

4. **응답 (Access Token)**
```json
{
  "access_token": "xxxxxx",
  "token_type": "bearer",
  "refresh_token": "xxxxxx",
  "expires_in": 21599,
  "refresh_token_expires_in": 5183999
}
```

### 2.3 Spring Boot 연동 구조

#### 2.3.1 의존성 설정

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>
```

#### 2.3.2 설정 파일

```yaml
# application.yml
spring:
  security:
    oauth2:
      client:
        registration:
          kakao:
            client-id: ${KAKAO_CLIENT_ID}
            client-secret: ${KAKAO_CLIENT_SECRET}
            redirect-uri: "{baseUrl}/login/oauth2/code/kakao"
            authorization-grant-type: authorization_code
            client-authentication-method: POST
            scope:
              - profile_nickname
              - profile_image
              - account_email
        provider:
          kakao:
            authorization-uri: https://kauth.kakao.com/oauth/authorize
            token-uri: https://kauth.kakao.com/oauth/token
            user-info-uri: https://kapi.kakao.com/v2/user/me
            user-name-attribute: id
```

#### 2.3.3 백엔드 구현 예시

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private KakaoOAuthService kakaoOAuthService;
    
    // 1. 프론트에서 인가 코드 받아서 처리
    @PostMapping("/kakao/callback")
    public ResponseEntity<TokenResponse> kakaoLogin(
        @RequestBody KakaoLoginRequest request
    ) {
        String accessToken = kakaoOAuthService
            .getAccessToken(request.getCode());
        
        KakaoUserInfo userInfo = kakaoOAuthService
            .getUserInfo(accessToken);
        
        // 우리 서비스의 JWT 토큰 발급
        String jwtToken = jwtService.generateToken(userInfo);
        
        return ResponseEntity.ok(
            new TokenResponse(jwtToken)
        );
    }
}

@Service
public class KakaoOAuthService {
    
    @Value("${spring.security.oauth2.client.registration.kakao.client-id}")
    private String clientId;
    
    @Value("${spring.security.oauth2.client.registration.kakao.redirect-uri}")
    private String redirectUri;
    
    private final RestTemplate restTemplate;
    
    public String getAccessToken(String code) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("grant_type", "authorization_code");
        params.add("client_id", clientId);
        params.add("redirect_uri", redirectUri);
        params.add("code", code);
        
        HttpEntity<MultiValueMap<String, String>> request = 
            new HttpEntity<>(params, headers);
        
        ResponseEntity<KakaoTokenResponse> response = restTemplate.postForEntity(
            "https://kauth.kakao.com/oauth/token",
            request,
            KakaoTokenResponse.class
        );
        
        return response.getBody().getAccessToken();
    }
    
    public KakaoUserInfo getUserInfo(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        ResponseEntity<KakaoUserInfoResponse> response = restTemplate.exchange(
            "https://kapi.kakao.com/v2/user/me",
            HttpMethod.GET,
            request,
            KakaoUserInfoResponse.class
        );
        
        return parseUserInfo(response.getBody());
    }
}
```

#### 2.3.4 JPA 엔티티 설계

```java
@Entity
@Table(name = "users")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String kakaoId; // 카카오 회원번호
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private AuthProvider provider; // KAKAO, GOOGLE, etc.
    
    private String email;
    private String nickname;
    private String profileImageUrl;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    private LocalDateTime lastLoginAt;
    
    // 학습 관련 필드
    private Integer rewardPoints = 0;
    
    @OneToMany(mappedBy = "user")
    private List<LearningProgress> learningProgresses;
}

public enum AuthProvider {
    KAKAO, GOOGLE, NAVER, LOCAL
}
```

### 2.4 React 프론트엔드 구현

#### 2.4.1 카카오 SDK 초기화

```javascript
// public/index.html
<script src="https://developers.kakao.com/sdk/js/kakao.js"></script>

// src/utils/kakaoAuth.js
export const initKakao = () => {
  if (window.Kakao && !window.Kakao.isInitialized()) {
    window.Kakao.init(process.env.REACT_APP_KAKAO_JS_KEY);
  }
};
```

#### 2.4.2 로그인 컴포넌트

```javascript
// src/components/KakaoLogin.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { initKakao } from '../utils/kakaoAuth';

const KakaoLogin = () => {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    initKakao();
  }, []);
  
  const handleKakaoLogin = () => {
    window.Kakao.Auth.authorize({
      redirectUri: `${window.location.origin}/oauth/kakao/callback`,
      scope: 'profile_nickname,profile_image,account_email'
    });
  };
  
  return (
    <button onClick={handleKakaoLogin} className="kakao-login-btn">
      <img src="/kakao-logo.png" alt="kakao" />
      카카오로 3초만에 시작하기
    </button>
  );
};

export default KakaoLogin;
```

#### 2.4.3 콜백 처리

```javascript
// src/pages/KakaoCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const KakaoCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code) {
      handleLogin(code);
    } else {
      // 에러 처리
      navigate('/login?error=no_code');
    }
  }, [searchParams]);
  
  const handleLogin = async (code) => {
    try {
      const response = await axios.post('/api/auth/kakao/callback', {
        code: code
      });
      
      // JWT 토큰 저장
      localStorage.setItem('accessToken', response.data.accessToken);
      
      // 메인 페이지로 이동
      navigate('/');
    } catch (error) {
      console.error('Login failed:', error);
      navigate('/login?error=login_failed');
    }
  };
  
  return <div>로그인 처리 중...</div>;
};

export default KakaoCallback;
```

### 2.5 보안 고려사항

#### 2.5.1 토큰 관리

**Access Token:**
- 유효기간: 6시간 (카카오 기본값)
- 저장: 메모리 or HttpOnly Cookie (XSS 방지)
- 사용: API 호출 시 Authorization 헤더

**Refresh Token:**
- 유효기간: 60일
- 저장: HttpOnly Cookie + Secure 플래그
- 사용: Access Token 만료 시 재발급

```java
@PostMapping("/refresh")
public ResponseEntity<TokenResponse> refreshToken(
    @CookieValue("refreshToken") String refreshToken
) {
    String newAccessToken = kakaoOAuthService.refreshAccessToken(refreshToken);
    return ResponseEntity.ok(new TokenResponse(newAccessToken));
}
```

#### 2.5.2 CSRF 방어

```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .and()
            .oauth2Login()
                .defaultSuccessUrl("/")
                .failureUrl("/login?error=true");
        
        return http.build();
    }
}
```

#### 2.5.3 Redirect URI 검증

카카오 개발자 콘솔에 등록된 Redirect URI만 허용됩니다:
- 개발: `http://localhost:3000/oauth/kakao/callback`
- 운영: `https://yourdomain.com/oauth/kakao/callback`

백엔드에서도 검증 로직 추가:
```java
private void validateRedirectUri(String redirectUri) {
    List<String> allowedUris = Arrays.asList(
        "http://localhost:3000/oauth/kakao/callback",
        "https://yourdomain.com/oauth/kakao/callback"
    );
    
    if (!allowedUris.contains(redirectUri)) {
        throw new InvalidRedirectUriException();
    }
}
```

### 2.6 관련 추가 개념

#### 2.6.1 JWT (JSON Web Token)

카카오에서 받은 사용자 정보로 우리 서비스의 JWT를 발급합니다.

```java
@Service
public class JwtService {
    
    @Value("${jwt.secret}")
    private String secret;
    
    public String generateToken(KakaoUserInfo userInfo) {
        return Jwts.builder()
            .setSubject(userInfo.getKakaoId())
            .claim("provider", "KAKAO")
            .claim("email", userInfo.getEmail())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // 24시간
            .signWith(SignatureAlgorithm.HS256, secret)
            .compact();
    }
}
```

#### 2.6.2 소셜 로그인 통합 설계

향후 구글, 네이버 등 다른 소셜 로그인 추가 시:

```java
public interface OAuthService {
    String getAccessToken(String code);
    OAuthUserInfo getUserInfo(String accessToken);
}

@Service
public class KakaoOAuthService implements OAuthService { ... }

@Service
public class GoogleOAuthService implements OAuthService { ... }

// Factory Pattern
@Component
public class OAuthServiceFactory {
    
    public OAuthService getService(AuthProvider provider) {
        switch (provider) {
            case KAKAO: return kakaoOAuthService;
            case GOOGLE: return googleOAuthService;
            default: throw new UnsupportedProviderException();
        }
    }
}
```

## 3. 적용 방안

### 3.1 구체적인 기능 적용

#### 3.1.1 회원가입/로그인 플로우
1. 랜딩 페이지에서 "카카오로 3초만에 시작하기" 버튼 배치
2. 신규 사용자: 카카오 정보 기반 자동 회원가입 + 초기 보상 포인트 지급
3. 기존 사용자: 즉시 로그인 + 마지막 학습 위치로 이동

```java
@Transactional
public User processKakaoLogin(KakaoUserInfo kakaoUserInfo) {
    Optional<User> existingUser = userRepository
        .findByKakaoIdAndProvider(kakaoUserInfo.getId(), AuthProvider.KAKAO);
    
    if (existingUser.isPresent()) {
        // 기존 사용자: 마지막 로그인 시간 업데이트
        User user = existingUser.get();
        user.setLastLoginAt(LocalDateTime.now());
        return userRepository.save(user);
    } else {
        // 신규 사용자: 회원가입 + 웰컴 보너스
        User newUser = User.builder()
            .kakaoId(kakaoUserInfo.getId())
            .provider(AuthProvider.KAKAO)
            .email(kakaoUserInfo.getEmail())
            .nickname(kakaoUserInfo.getNickname())
            .profileImageUrl(kakaoUserInfo.getProfileImageUrl())
            .rewardPoints(1000) // 웰컴 보너스
            .createdAt(LocalDateTime.now())
            .lastLoginAt(LocalDateTime.now())
            .build();
        
        return userRepository.save(newUser);
    }
}
```

#### 3.1.2 프로필 정보 활용
- **닉네임:** 학습 대시보드에서 "{닉네임}님의 학습 현황" 표시
- **프로필 이미지:** 리더보드, 커뮤니티 기능에서 사용
- **이메일:** 학습 알림, 이벤트 공지 발송 (동의 시)

```java
@Entity
@Table(name = "learning_progress")
public class LearningProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user; // 카카오 로그인 사용자
    
    private String courseId;
    private Integer progress; // 0-100
    private Integer earnedPoints;
}
```

### 3.2 구현 시 고려사항

#### 3.2.1 에러 처리
- **인가 코드 만료:** 사용자에게 재로그인 안내
- **토큰 갱신 실패:** 자동 로그아웃 + 로그인 페이지 이동
- **카카오 API 장애:** 폴백 UI 제공 (일반 로그인 옵션)

```javascript
// React Error Boundary
class OAuthErrorBoundary extends React.Component {
  componentDidCatch(error, errorInfo) {
    if (error.name === 'OAuthError') {
      // 로그인 페이지로 리다이렉트
      window.location.href = '/login?error=oauth_failed';
    }
  }
  
  render() {
    return this.props.children;
  }
}
```

#### 3.2.2 사용자 경험 최적화
- **로딩 인디케이터:** OAuth 프로세스 진행 중 표시
- **에러 메시지 한글화:** "로그인에 실패했습니다. 다시 시도해주세요."
- **자동 로그인:** Remember Me 기능 (Refresh Token 활용)

#### 3.2.3 데이터베이스 인덱싱
```sql
-- 카카오 ID로 빠른 조회
CREATE INDEX idx_user_kakao_provider 
ON users(kakao_id, provider);

-- 이메일로 검색
CREATE INDEX idx_user_email 
ON users(email);
```

### 3.3 단계별 적용 시나리오

#### Phase 1: MVP
- [ ] 카카오 로그인 기본 구현
- [ ] 신규 사용자 자동 가입
- [ ] JWT 기반 세션 관리
- [ ] 프로필 정보 저장

**목표:** 사용자가 카카오 계정으로 로그인하고 학습을 시작할 수 있는 환경 구축

#### Phase 2: 개선
- [ ] Refresh Token 자동 갱신
- [ ] 로그아웃 기능
- [ ] 회원 탈퇴 기능 (카카오 연결 끊기)
- [ ] 에러 처리 강화

**목표:** 안정적인 인증 시스템 완성

#### Phase 3: 확장
- [ ] 이메일 기반 일반 로그인 추가
- [ ] 구글, 네이버 소셜 로그인 추가
- [ ] 계정 연동 기능 (여러 소셜 계정을 하나의 계정으로)
- [ ] 관리자 대시보드에서 사용자 인증 현황 모니터링

**목표:** 다양한 로그인 방식 지원 및 통합 관리

## 4. 느낀 점

### 4.1 학습 인사이트

OAuth 2.0은 단순히 "카카오 버튼 클릭 → 로그인"이 아니라, 사용자 신뢰를 위임받는 과정입니다. 특히 금융 관련 서비스에서는:
- **동의 항목 최소화:** 꼭 필요한 정보만 요청 (닉네임, 프로필 이미지)
- **투명한 정보 활용:** 어떤 정보를 왜 사용하는지 명확히 안내
- **언제든 연결 해제:** 사용자가 카카오 연결을 끊을 수 있는 옵션 제공

이는 "사회 초년생이 안심하고 사용할 수 있는 서비스"라는 우리 프로젝트의 핵심 가치와 부합합니다.

### 4.2 아키텍처 영향

**백엔드 관점:**
- Spring Security OAuth2 Client를 활용하면 보일러플레이트 코드를 줄일 수 있습니다.
- JPA User 엔티티에 `AuthProvider` 필드를 두어 확장성을 확보했습니다.
- JWT 발급으로 Stateless 아키텍처 유지 가능 (서버 확장 용이)

**프론트엔드 관점:**
- Axios Interceptor를 활용한 토큰 자동 갱신으로 사용자 경험 개선
- Context API로 전역 인증 상태 관리
- Protected Route 패턴으로 인증 필요 페이지 보호

**데이터베이스 관점:**
- 소셜 로그인 사용자는 `password` 필드가 null이므로, 일반 로그인 전환 시 비밀번호 설정 플로우 필요
- `AuthProvider` Enum으로 다중 소셜 로그인 지원 준비

### 4.3 사용자 경험 영향

**긍정적 영향:**
- 회원가입 이탈률 약 40% 감소 예상 (업계 평균 데이터 기준)
- 카카오톡 알림톡 연동 가능 (학습 리마인더, 이벤트 알림)
- 프로필 이미지 활용으로 커뮤니티 기능 활성화

**주의 사항:**
- 카카오 서비스 장애 시 대체 로그인 수단 필요
- 사용자가 카카오 계정을 변경하면 기존 학습 데이터 연결 끊김 (이메일 매핑 필요)

### 4.4 추가 학습 필요 항목

**1. Spring Security 심화**
- Filter Chain 구조 이해
- Authentication, Authorization 구분
- Custom AuthenticationProvider 구현

**2. HTTPS 및 인증서 관리**
- OAuth는 HTTPS 필수
- Let's Encrypt 무료 인증서 발급
- Nginx 리버스 프록시 설정

**3. 모니터링 및 로깅**
- OAuth 실패 로그 수집 (Sentry, CloudWatch)
- 로그인 성공률, 소요 시간 메트릭 추적
- 비정상 로그인 시도 감지 (Rate Limiting)

**4. 법적 요구사항**
- 개인정보 처리방침 작성 (카카오 로그인 명시)
- 이용약관에 제3자 정보 제공 동의 포함
- 만 14세 미만 이용 제한 (금융 서비스)

**5. 성능 최적화**
- Redis를 활용한 토큰 캐싱
- 카카오 API 호출 최소화 (사용자 정보 DB 캐싱)
- Connection Pool 튜닝

---

카카오 로그인을 실제 프로젝트에 적용하기 위한 기술적 기반을 학습했습니다. MVP 단계에서는 Phase 1의 항목들을 우선 구현하고, 사용자 피드백을 받으며 점진적으로 개선해 나가는 것이 나아보입니다.