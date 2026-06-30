---
title: 'Spring Boot Whitelabel Error Page 404 — REST API에서 자주 하는 실수'
description: 'API인데 HTML Whitelabel 404가 나올 때 원인과 application.properties 설정'
pubDate: 2026-07-01
category: spring
tags: ['spring-boot', 'rest', '404']
---

REST API를 만들었는데 클라이언트에는 JSON이 아니라 **Whitelabel Error Page** HTML이 내려오면 당황스럽습니다. Spring Boot가 `/error`로 포워딩하면서 브라우저용 기본 페이지를 보여주는 거예요. GitHub 이슈에서도 REST 전용 앱인데 static resource handler가 `/**`를 먹어버리는 패턴이 자주 나옵니다.

## 증상

- Postman/curl 요청 시 `Content-Type: text/html`
- 본문에 "Whitelabel Error Page", "status": 404
- 컨트롤러에 분명히 `@GetMapping`이 있는데도 404

## 원인 1: URL·HTTP 메서드 불일치

가장 단순하지만 제일 많습니다.

| 확인 | 예 |
| --- | --- |
| trailing slash | `/api/users` vs `/api/users/` |
| context-path | `server.servlet.context-path=/api` 빠뜨림 |
| 메서드 | `GET` vs `POST` |

로그에 `Mapped to ...`가 안 찍히면 매핑 자체가 안 된 겁니다.

## 원인 2: static resource가 요청을 가로챔

Spring Boot는 기본적으로 static 리소스 핸들러가 넓게 매핑됩니다. REST API만 제공할 때는 끄는 경우가 많아요.

```properties
spring.web.resources.add-mappings=false
```

[Spring Boot #3980](https://github.com/spring-projects/spring-boot/issues/3980) 논의에서도 REST 앱은 static mapping을 끄는 쪽이 권장되는 경우가 많습니다.

## 원인 3: Spring Boot 3.x의 404 동작 변경

Spring Framework 6 / Boot 3에서는 리소스 없음이 `NoResourceFoundException`으로 올라오기도 합니다. `@ControllerAdvice`로 통일하려면:

```java
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @Override
    protected ResponseEntity<Object> handleNoResourceFoundException(
            NoResourceFoundException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        Map<String, Object> body = Map.of(
            "error", "NOT_FOUND",
            "message", ex.getMessage()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }
}
```

## 원인 4: 컨트롤러 스캔 누락

메인 클래스와 컨트롤러 패키지가 다르면 빈이 안 올라갑니다.

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {
    @GetMapping("/{id}")
    public UserDto get(@PathVariable Long id) { ... }
}
```

`com.example.app`에 `Application`이 있고 컨트롤러가 `com.other`에 있으면 스캔이 안 됩니다.

## JSON 에러 응답으로 통일하기

Boot 기본 `/error`는 `BasicErrorController`가 처리합니다. API 전용으로 커스터마이즈할 때는 `ErrorController` 구현 또는 전역 `@ControllerAdvice`를 씁니다.

```properties
server.error.include-message=always
server.error.include-binding-errors=always
spring.mvc.problemdetails.enabled=true
```

Spring Boot 3의 [Problem Details (RFC 7807)](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html) 지원을 켜면 JSON 형식이 일관됩니다.

## 빠른 진단 순서

1. `logging.level.org.springframework.web=DEBUG`로 **매핑 로그** 확인
2. 404 응답이 HTML인지 JSON인지 확인
3. REST 전용이면 `spring.web.resources.add-mappings=false` 검토
4. Boot 3이면 `NoResourceFoundException` 핸들러 추가
5. `@RequestMapping` 경로·context-path 재확인

## 마무리

Whitelabel 404는 "서버가 죽었다"기보다 **요청이 내 컨트롤러에 도달하지 못했다**는 신호에 가깝습니다. static handler, 경로 오타, 스캔 범위부터 보면 대부분 금방 좁혀집니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Spring Boot — Error Handling](https://docs.spring.io/spring-boot/docs/current/reference/html/web.html#web.servlet.spring-mvc.error-handling)
- [spring-projects/spring-framework#29491](https://github.com/spring-projects/spring-framework/issues/29491)
