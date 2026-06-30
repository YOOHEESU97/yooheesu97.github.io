---
title: 'Java Stream API 실무에서 자주 쓰는 패턴'
description: 'filter, map, collect 조합과 Optional 체이닝을 실무 예제로 정리한 노트'
pubDate: 2026-06-28
category: java
tags: ['java', 'stream', 'backend']
---

Java로 API 만들다 보면 컬렉션 가공이 반복됩니다. 예전엔 for문에 if를 계속 붙였는데, Stream API 쓰다 보니 읽기는 훨씬 나아졌어요. 다만 처음엔 "이걸 왜 이렇게 쓰지?" 싶을 수 있어서, 실무에서 자주 나오는 패턴만 골라 정리했습니다.

## 기본 흐름

Stream은 **데이터를 흘려내며 변환**하는 방식입니다. 중간 연산(`filter`, `map`)과 최종 연산(`collect`, `reduce`)으로 나뉩니다.

```java
List<String> activeUserNames = users.stream()
    .filter(User::isActive)
    .map(User::getName)
    .sorted()
    .toList();
```

위 코드는 "활성 사용자 이름을 정렬해서 리스트로"라는 의도가 한눈에 들어옵니다. for문으로 쓰면 변수 선언과 루프가 늘어나거든요.

## 자주 쓰는 중간 연산

| 연산 | 용도 | 예시 |
| --- | --- | --- |
| `filter` | 조건 통과만 남김 | `.filter(u -> u.getAge() >= 19)` |
| `map` | 형태 변환 | `.map(User::getEmail)` |
| `flatMap` | 중첩 컬렉션 펼침 | `.flatMap(order -> order.getItems().stream())` |
| `distinct` | 중복 제거 | `.map(User::getDept).distinct()` |
| `sorted` | 정렬 | `.sorted(Comparator.comparing(User::getName))` |

## collect 패턴

### DTO 리스트로 변환

```java
List<UserSummaryDto> summaries = users.stream()
    .filter(User::isActive)
    .map(user -> new UserSummaryDto(user.getId(), user.getName()))
    .toList();
```

### Map으로 그룹핑

부서별 인원 수를 세는 경우가 많습니다.

```java
Map<String, Long> countByDept = users.stream()
    .collect(Collectors.groupingBy(User::getDept, Collectors.counting()));
```

### 통계 한 번에

```java
IntSummaryStatistics stats = users.stream()
    .mapToInt(User::getScore)
    .summaryStatistics();

double average = stats.getAverage();
```

## Optional과 함께 쓸 때

`findFirst`, `max`, `min`은 `Optional`을 반환합니다. null 체크 대신 아래처럼 처리하는 편이 안전해요.

```java
Optional<User> topScorer = users.stream()
    .max(Comparator.comparingInt(User::getScore));

String name = topScorer.map(User::getName).orElse("없음");
```

## 피하려고 하는 패턴

1. **한 메서드에 stream 체인 10줄 이상** — 가독성이 떨어지면 private 메서드로 쪼갭니다.
2. **부수 효과(side effect)** — `forEach` 안에서 DB 저장 같은 걸 하면 디버깅이 어려워집니다. 가능하면 `map` + `collect` 후 별도 처리합니다.
3. **병렬 스트림 남용** — 데이터가 작으면 오히려 느려질 수 있어요. 대용량 배치에서만 검토합니다.

## 실무 체크리스트

- [ ] null 가능 필드는 `filter(Objects::nonNull)`로 걸러냈는가
- [ ] `toList()` 결과가 수정 불가인지 의도한 것인가 (Java 16+)
- [ ] 그룹핑 키가 null일 때 `groupingBy(..., HashMap::new, ...)`가 필요한지 확인했는가
- [ ] 성능이 중요한 핫패스면 stream vs for 루프를 간단히 비교했는가

## 마무리

Stream은 문법이 익숙해지면 "데이터 파이프라인"을 선언적으로 쓸 수 있어서 유지보수에 도움이 됩니다. 처음부터 모든 곳에 쓸 필요는 없고, **리스트 변환·필터·집계**가 반복되는 지점부터 적용해 보시면 됩니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.
