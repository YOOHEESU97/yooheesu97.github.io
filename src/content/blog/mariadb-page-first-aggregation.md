---
title: 'MariaDB 목록 쿼리 최적화: LIMIT 뒤에 집계하기'
description: '전체 데이터를 JOIN·집계한 뒤 20건을 자르는 쿼리를 페이지 선정 후 집계하는 구조로 바꾸는 방법'
pubDate: 2026-10-11
publishedAt: 2026-10-11T23:17:14+09:00
category: sql
tags: ['mariadb', 'query-performance', 'pagination']
---

목록 화면에서 이벤트 20건과 각 이벤트의 응모 건수를 함께 보여줘야 했습니다. 처음에는 응모 테이블 전체를 `JOIN`하고 집계한 다음 마지막에 `LIMIT 20`을 적용했어요. 실행 계획에는 큰 테이블을 반복해서 읽은 흔적이 보였습니다. 화면에는 20건만 필요한데, 나머지 이벤트의 응모 건수까지 먼저 계산하는 구조였던 셈입니다.

아래 예시는 실제 대화에서 다룬 문제를 **가상의 테이블과 값**으로 다시 만든 것입니다. 실행 시간 개선 수치는 측정하지 않았으므로 적지 않았습니다.

## 처음 쿼리의 처리 범위

```sql
SELECT e.id, e.created_at, COUNT(a.id) AS application_count
FROM events AS e
LEFT JOIN applications AS a ON a.event_id = e.id
WHERE e.status = 'OPEN'
GROUP BY e.id, e.created_at
ORDER BY e.created_at DESC, e.id DESC
LIMIT 20;
```

이 쿼리는 결과가 20행이더라도, DB가 조건에 맞는 이벤트들의 응모 데이터를 폭넓게 읽고 묶어야 할 수 있습니다. 실제 읽는 양은 인덱스, 데이터 분포, 옵티마이저 선택에 따라 달라지므로 `EXPLAIN`으로 확인해야 합니다.

## 먼저 페이지를 고르기

응모 건수가 **검색 조건이나 정렬 조건에 쓰이지 않는다면**, 이벤트 20건을 먼저 고르고 그 20건의 응모만 집계할 수 있습니다.

```sql
WITH page_events AS (
    SELECT id, created_at
    FROM events
    WHERE status = 'OPEN'
    ORDER BY created_at DESC, id DESC
    LIMIT 20
), application_counts AS (
    SELECT a.event_id, COUNT(*) AS application_count
    FROM applications AS a
    INNER JOIN page_events AS p ON p.id = a.event_id
    GROUP BY a.event_id
)
SELECT p.id,
       p.created_at,
       COALESCE(c.application_count, 0) AS application_count
FROM page_events AS p
LEFT JOIN application_counts AS c ON c.event_id = p.id
ORDER BY p.created_at DESC, p.id DESC;
```

`page_events`는 화면에 표시할 행을 정합니다. `application_counts`는 그 행에 속한 응모만 셉니다. 마지막 `LEFT JOIN`과 `COALESCE` 덕분에 응모가 0건인 이벤트도 결과에서 사라지지 않습니다.

기존 대화에서는 세 번째 테이블을 응모 한 건마다 조회하던 구조도 있었습니다. 이때는 응모를 `이벤트 ID + 항목 ID`로 **선집계**한 뒤 항목 테이블과 결합하면 조회 횟수를 줄일 여지가 있습니다. 다만 항목 테이블의 키가 유일해야 원래 건수와 의미가 같아집니다.

## 결과가 정말 같은지 확인할 조건

- 응모 건수로 필터링하거나 정렬한다면 `LIMIT`을 앞으로 옮기면 결과가 달라질 수 있습니다.
- `ORDER BY created_at DESC`만 쓰면 같은 시각의 행 순서가 불안정합니다. `id`처럼 유일한 보조 정렬 키를 넣습니다.
- 원본 쿼리의 회사 코드, 날짜, 상태 조건을 빠뜨리지 않았는지 비교합니다. 상수를 파라미터로 바꾸는 것만으로도 결과가 달라질 수 있습니다.
- `LEFT JOIN`을 `INNER JOIN`으로 바꾸면 응모가 없는 이벤트가 누락됩니다.

같은 파라미터로 두 쿼리의 이벤트 ID, 행 순서, 응모 건수를 비교한 뒤 실행 계획을 봅니다. MariaDB 버전이 지원한다면 `ANALYZE FORMAT=JSON SELECT ...`로 실제 읽은 행과 시간을 살펴볼 수 있고, 우선 `EXPLAIN`의 `key`, `rows`, 조인 순서만 봐도 방향을 잡을 수 있습니다. `applications(event_id)` 인덱스가 없으면 페이지를 먼저 골라도 응모 테이블을 크게 읽을 수 있습니다.

핵심은 `LIMIT`이라는 문법 자체가 아니라 **비싼 계산을 어떤 행에 수행하느냐**입니다.

## 참고

- [MariaDB 문서: ANALYZE와 EXPLAIN](https://mariadb.com/docs/server/reference/sql-statements/administrative-sql-statements/analyze-and-explain-statements)
