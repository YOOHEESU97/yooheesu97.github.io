---
title: 'Java java.lang.OutOfMemoryError: Java heap space — 힙 부족 대응'
description: '-Xmx 조정, 메모리 누수 의심 지점, heap dump로 원인 찾기'
pubDate: 2026-06-29
category: java
tags: ['java', 'jvm', 'memory']
---

장시간 돌아가는 Java 서버에서:

```
java.lang.OutOfMemoryError: Java heap space
```

JVM 힙이 가득 찼다는 뜻입니다. `-Xmx`를 올리면 임시로 살 수 있지만, **왜 메모리를 먹는지**를 봐야 재발을 막습니다.

## 1. 즉시 응급 — 힙 상한 조정

```bash
java -Xms512m -Xmx2g -jar app.jar
```

Spring Boot:

```properties
# JVM 옵션은 JAVA_TOOL_OPTIONS 또는 실행 스크립트
JAVA_OPTS="-Xms512m -Xmx2g"
```

힙을 무한히 키우면 GC만 길어지고 OS swap까지 갈 수 있어요.

## 2. OOM 시 heap dump 남기기

```bash
java -XX:+HeapDumpOnOutOfMemoryError \
     -XX:HeapDumpPath=/tmp/heapdump.hprof \
     -jar app.jar
```

Eclipse MAT, VisualVM, `jhsdb jmap`으로 **어떤 객체가 많은지** 봅니다.

## 3. 흔한 원인

| 원인 | 예 |
| --- | --- |
| 대용량 리스트 적재 | 전체 DB `findAll()` |
| 캐시 무제한 성장 | Map에 TTL 없이 축적 |
| 스트림 미종료 | 파일·DB 커넥션 누수 |
| 클래스 로더 누수 | 핫 리로드 반복 (구형 컨테이너) |
| 큰 byte[] | 이미지·엑셀 전체 메모리 로드 |

## 4. JPA에서 전체 로드 피하기

```java
// ❌
List<Order> all = orderRepository.findAll();

// ✅ 페이징
Page<Order> page = orderRepository.findAll(PageRequest.of(0, 100));
```

## 5. GC 로그 확인

```bash
java -Xlog:gc*:file=gc.log -jar app.jar
```

Full GC가 반복되는데 힙이 안 비면 leak 가능성이 큽니다.

## 6. Native memory (heap 외)

`OutOfMemoryError: Metaspace`면 클래스 메타데이터, `Direct buffer memory`면 Netty 등 off-heap 이슈입니다. 메시지 **전체**를 구분해서 봅니다.

## 운영 체크리스트

- [ ] OOM 시 heap dump 경로 확보
- [ ] 배치·export는 스트리밍/페이징
- [ ] 캐시 max size·TTL 설정
- [ ] 모니터링(힙 사용률, GC pause)

## 마무리

heap space OOM은 "메모리가 모자란다"기보다 **너무 많이 들고 있다**는 신호인 경우가 많았습니다. dump 한 번으로 리스트 전체 로드 같은 패턴이 바로 보이기도 해요.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Java — The java Command](https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html)
- [Eclipse MAT](https://eclipse.dev/mat/)
