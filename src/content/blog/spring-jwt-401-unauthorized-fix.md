---
title: 'Spring Security JWT 401 Unauthorized — 토큰 검증 실패 해결'
description: 'Bearer 토큰 형식, secret 불일치, 만료·CORS에서 나는 401 디버깅'
pubDate: 2026-06-29
updatedDate: 2026-06-30
category: spring
tags: ['spring', 'security', 'jwt']
---

React 프론트와 Spring Boot API를 붙이는 프로젝트에서, Postman으로는 200이 나오는데 브라우저에서만 전부 `401 Unauthorized`가 떴습니다. 프론트 코드를 한참 뒤져다가 알고 보니 `Authorization` 헤더에 토큰만 넣고 **`Bearer ` 접두사를 빼먹은 것**이었어요. 서버 로그에는 "Invalid JWT" 한 줄만 남아 있어서 처음엔 secret 불일치인 줄 알고 `.env`를 여러 번 갈아엎었습니다.

로컬에서는 우연히 맞았던 설정이 스테이징에서 깨지는 경우도 있었는데, 발급 서버와 검증 서버의 `jwt.secret`이 달랐더라고요. 401은 증상만 같고 원인은 필터 체인·헤더 형식·secret 불일치 중 하나인 경우가 많아서, 패턴만 익혀 두면 빠르게 좁혀집니다.

## 401이 나는 대표 원인

| 원인 | 증상 |
| --- | --- |
| `Authorization` 헤더 없음 | 모든 보호 API 401 |
| `Bearer` 접두사 누락/오타 | 토큰 파싱 실패 |
| secret/key 불일치 | 발급 서버 ≠ 검증 서버 |
| 토큰 만료 | 일정 시간 후만 401 |
| 잘못된 issuer/audience | 검증 단계에서 reject |
| Security 경로 설정 | 로그인은 되는데 특정 URL만 401 |

## 1. Authorization 헤더 형식

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

```javascript
fetch('/api/me', {
  headers: { Authorization: `Bearer ${accessToken}` },
});
```

`Bearer`와 토큰 사이 **공백 한 칸**이 필요합니다. `Bearer${token}`은 실패합니다.

## 2. JwtAuthenticationFilter 예시

```java
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (tokenProvider.validate(token)) {
                Authentication auth = tokenProvider.getAuthentication(token);
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }
        chain.doFilter(request, response);
    }
}
```

`validate` 실패 시 컨텍스트가 비어 있으면 이후 `authenticated()`에서 401이 납니다.

## 3. secret 불일치

```properties
jwt.secret=${JWT_SECRET}
jwt.expiration-ms=3600000
```

로컬·스테이징·프로덕션 **환경 변수가 다르면** 한 환경에서 발급한 토큰을 다른 환경에서 검증할 수 없습니다. `jjwt` 사용 시 키 길이 부족으로 기동 실패하는 경우도 있어요 (HS256 최소 256bit).

## 4. SecurityFilterChain 경로

```java
@Bean
SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(csrf -> csrf.disable())
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**").permitAll()
            .requestMatchers("/api/**").authenticated()
        )
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
}
```

`/api/auth/login`이 `authenticated()` 뒤에 있으면 로그인도 401입니다.

## 5. CORS + credentials

브라우저에서 쿠키·인증 헤더를 쓰면:

```java
configuration.setAllowedOrigins(List.of("https://yooheesu97.github.io"));
configuration.setAllowedHeaders(List.of("*"));
configuration.setExposedHeaders(List.of("Authorization"));
```

프리플라이트가 막히면 401처럼 보이기도 합니다. Network 탭에서 **실제 응답 코드**를 확인하세요.

## 디버깅 순서

1. [jwt.io](https://jwt.io)에서 payload `exp`, `iss` 확인
2. 서버 로그에 `JwtException`, `ExpiredJwtException` 있는지 검색
3. Postman으로 `Authorization` 헤더만 바꿔 재현
4. `logging.level.org.springframework.security=DEBUG` (개발 환경만)
5. 발급·검증이 같은 `secret`/키 쌍인지 환경별로 대조

## 401 vs 403

- **401**: 인증 실패 (토큰 없음·잘못됨·만료)
- **403**: 인증은 됐으나 권한 없음 (`@PreAuthorize` 등)

클라이언트에서 둘을 구분해 처리하면 UX가 나아집니다.

## 마무리

JWT 401은 대부분 **헤더 형식·secret·경로 설정** 세 가지입니다. 토큰을 디코딩해 `exp`를 먼저 보고, 서버는 필터와 `SecurityFilterChain` 순서를 맞추면 됩니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Spring Security Reference](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/jwt.html)
- [RFC 6750 — Bearer Token](https://datatracker.ietf.org/doc/html/rfc6750)
