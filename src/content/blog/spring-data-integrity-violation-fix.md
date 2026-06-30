---
title: 'Spring DataIntegrityViolationException — duplicate key / unique 제약 해결'
description: 'JPA save 시 중복 키 예외 처리, 사전 검증 vs 예외 catch, 트랜잭션 롤백 주의'
pubDate: 2026-07-02
category: spring
tags: ['spring', 'jpa', 'error']
---

`org.springframework.dao.DataIntegrityViolationException`은 DB 제약 조건을 어겼을 때 Spring이 던지는 대표 예외입니다. 로그에 `Duplicate entry`나 `unique constraint`가 보이면 대부분 이 계열이에요. JPA를 쓰면 JDBC의 `DuplicateKeyException` 대신 이쪽으로 올라오는 경우가 많습니다.

## 전형적인 로그

```
could not execute statement; SQL [insert into users ...];
constraint [uk_users_email]; nested exception is org.hibernate.exception.ConstraintViolationException
```

## 왜 JPA에서는 DuplicateKeyException이 안 나오나

Spring Framework 이슈([SPR-11669](https://github.com/spring-projects/spring-framework/issues/16292))에서도 언급되듯, **JPA(Hibernate) 경로에서는 unique/PK 위반이 대부분 `DataIntegrityViolationException`으로 번역**됩니다. JDBC 템플릿과 예외 타입이 다를 수 있어요.

## 접근 1: 저장 전에 exists 검사 (권장 — 비즈니스상 흔한 중복)

중복이 "예외적인 상황"이 아니라면, catch보다 **조회 후 분기**가 안전합니다.

```java
@Transactional
public User register(RegisterRequest req) {
    return userRepository.findByEmail(req.email())
        .orElseGet(() -> userRepository.save(mapper.toEntity(req)));
}
```

트랜잭션이 롤백 마크되지 않아 후속 로직을 이어가기 쉽습니다.

## 접근 2: 예외 catch + 제약 이름 확인

```java
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name = "uk_users_email", columnNames = "email"))
public class User { ... }
```

```java
try {
    userRepository.save(user);
} catch (DataIntegrityViolationException e) {
    if (e.getMessage() != null && e.getMessage().contains("uk_users_email")) {
        throw new DuplicateEmailException(req.email());
    }
    throw e;
}
```

메시지 파싱은 DB·드라이버마다 달라서 **제약 이름을 코드에 명시**해 두는 편이 낫습니다.

## 접근 3: SQLState로 판별 (PostgreSQL)

```java
Throwable root = e.getMostSpecificCause();
if (root instanceof PSQLException psql && "23505".equals(psql.getSQLState())) {
    throw new DuplicateEmailException("이미 사용 중인 값입니다.");
}
```

## catch 후 같은 트랜잭션에서 save 재시도?

**주의:** `DataIntegrityViolationException`이 나면 현재 트랜잭션이 rollback-only로 표시되는 경우가 많습니다. 같은 `@Transactional` 메서드 안에서 catch 후 또 `save`하면 `UnexpectedRollbackException`이 이어질 수 있어요.

- 중복이 **정상 케이스** → 사전 `find` 패턴
- catch 필요 → `@Transactional(propagation = REQUIRES_NEW)`로 분리하거나 서비스 레이어를 쪼갬

## 연관 원인 정리

| 원인 | 증상 | 대응 |
| --- | --- | --- |
| UNIQUE 위반 | duplicate entry | exists check / 409 응답 |
| FK 없음 | foreign key constraint | 부모 엔티티 먼저 persist |
| NOT NULL | Column cannot be null | DTO 검증 + `@NotNull` |
| PK 중복 | Duplicate entry for key PRIMARY | ID 생성 전략 점검 |

## API 응답으로 변환

```java
@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(DuplicateEmailException.class)
    public ResponseEntity<?> handle(DuplicateEmailException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("error", "DUPLICATE_EMAIL", "message", e.getMessage()));
    }
}
```

클라이언트에는 500이 아니라 **409 Conflict**가 맞는 경우가 많습니다.

## 마무리

`DataIntegrityViolationException`은 "DB가 거절했다"는 신호입니다. 중복이 자주 나오는 도메인이면 catch보다 **조회 후 upsert/분기**가 유지보수에 유리했고, 정말 예외적인 제약 위반만 전역 핸들러로 매핑했습니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Spring DataIntegrityViolationException — Baeldung](https://www.baeldung.com/spring-dataintegrityviolationexception)
- [Stack Overflow — JPA unique constraint](https://stackoverflow.com/questions/3502279/how-to-handle-jpa-unique-constraint-violations)
