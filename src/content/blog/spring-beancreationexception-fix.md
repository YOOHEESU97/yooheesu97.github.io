---
title: 'Spring BeanCreationException — 원인별 해결 가이드'
description: 'Spring Boot 기동 실패 시 BeanCreationException 스택트레이스를 읽고 고치는 방법'
pubDate: 2026-06-28
category: spring
tags: ['spring', 'spring-boot', 'error']
---

Spring Boot 앱을 띄우다 보면 긴 스택트레이스 끝에 `BeanCreationException`이 붙어 있는 경우가 많습니다. 겉으로는 비슷해 보이는데, 실제 원인은 `Caused by:` 아래에 숨어 있어요. 저도 처음엔 로그 맨 위만 보다가 한참 헤맸는데, **아래에서 위로** 읽는 습관을 들이니까 훨씬 빨라졌습니다.

## 에러가 의미하는 것

`BeanCreationException`은 Spring IoC 컨테이너가 빈을 만들다 실패했다는 **포장 예외**입니다. 진짜 원인은 보통 아래 중 하나예요.

| Caused by | 의미 |
| --- | --- |
| `NoSuchBeanDefinitionException` | 주입할 빈이 없음 |
| `NoUniqueBeanDefinitionException` | 같은 타입 빈이 2개 이상 |
| `UnsatisfiedDependencyException` | 생성자/필드 주입 실패 |
| `BeanInstantiationException` | 생성자 실행 중 예외 |

## 1. NoSuchBeanDefinitionException — 빈을 못 찾음

가장 흔한 케이스입니다.

```
Parameter 0 of constructor in com.example.UserController 
required a bean of type 'com.example.UserService' that could not be found.
```

**체크리스트:**

1. `UserService`에 `@Service` (또는 `@Component`)가 있는가
2. 패키지가 `@SpringBootApplication` 스캔 범위 안인가
3. 모듈/테스트에서 `@SpringBootTest`만 쓰고 slice 테스트가 빈을 안 올리는 건 아닌가

```java
@SpringBootApplication
@ComponentScan(basePackages = "com.example")  // 필요할 때만 명시
public class Application { }
```

Repository가 안 잡히면 `@EnableJpaRepositories(basePackages = "com.example.repository")`도 확인합니다. JPA starter 버전이 꼬이면 repository 빈이 0개로 뜨는 경우도 봤어요.

## 2. NoUniqueBeanDefinitionException — 빈이 너무 많음

인터페이스 구현체가 2개인데 `@Autowired`만 쓰면 발생합니다.

```java
@Service
@Primary
public class EmailNotificationService implements NotificationService { }

@Service
@Qualifier("sms")
public class SmsNotificationService implements NotificationService { }

// 주입 측
public OrderService(@Qualifier("sms") NotificationService notificationService) { }
```

`@Primary`, `@Qualifier`, 또는 `@Autowired List<NotificationService>` 중 하나로 의도를 분명히 합니다.

## 3. 순환 참조 (Circular dependency)

A → B → A 구조면 기동이 실패하거나 `@Lazy` 없이는 풀리지 않을 수 있습니다.

```java
@Service
public class ServiceA {
    public ServiceA(@Lazy ServiceB serviceB) { }
}
```

근본적으로는 구조를 쪼개는 게 맞고, `@Lazy`는 임시 응급처치로 씁니다.

## 4. @PostConstruct / 초기화 실패

빈은 만들어졌는데 `@PostConstruct`에서 NPE가 나면 역시 `BeanCreationException`으로 감싸집니다. **실패한 빈 이름** 로그를 보고 해당 메서드에 breakpoint를 겁니다.

## 5. 의존성 버전 충돌

Spring 라이브러리 버전이 섞이면 `NoSuchMethodError`가 `BeanInstantiationException` 안에 숨습니다.

```bash
./mvnw dependency:tree | grep spring
```

BOM(`spring-boot-starter-parent`)으로 버전을 맞추는 게 안전합니다.

## 디버깅에 쓰는 설정

`application.properties`:

```properties
debug=true
logging.level.org.springframework.beans.factory=DEBUG
```

Spring Boot 3에서는 조건 평가 로그(`org.springframework.boot.autoconfigure`)가 **왜 특정 auto-config가 빠졌는지** 알려줍니다.

## 실무 순서 (요약)

1. 스택트레이스 **맨 아래 `Caused by`** 확인
2. 실패한 **빈 클래스 이름** 메모
3. 어노테이션·패키지 스캔·주입 타입 점검
4. 안 되면 `debug=true`로 조건 로그 확인
5. 멀티 모듈이면 `dependency:tree`로 버전 충돌 확인

## 방지 팁

- 생성자 주입 + `final` 필드를 기본으로 (테스트·명확성)
- 인터페이스 구현체가 늘어날 때부터 `@Qualifier` 네이밍 규칙 정하기
- `@SpringBootApplication`과 도메인 패키지 구조를 어긋나지 않게 유지

## 마무리

`BeanCreationException`은 이름만 보면 막막하지만, 대부분 **빈 없음 / 빈 중복 / 순환 참조 / 초기화 실패** 네 가지로 수렴합니다. 로그를 아래에서 읽는 것만으로도 해결 시간이 꽤 줄어들더라고요.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Spring BeanCreationException — Baeldung](https://www.baeldung.com/spring-beancreationexception)
- [Spring Boot Reference — Error Handling](https://docs.spring.io/spring-boot/docs/current/reference/html/web.html#web.servlet.spring-mvc.error-handling)
