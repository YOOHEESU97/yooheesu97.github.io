---
title: 'MariaDB 날짜 검색: 종료일 포함과 기간 겹침을 정확히 쓰기'
description: 'YYYYMMDD 입력을 날짜로 바꾸고 반개구간과 기간 겹침 조건으로 검색하는 방법'
pubDate: 2026-10-11
category: sql
tags: ['mariadb', 'date-range', 'index']
---

조회 종료일이 `20260915`라면 9월 15일 23시대의 데이터도 나와야 합니다. 그런데 `DATETIME` 컬럼에 `<= '2026-09-15'`를 쓰면 그날 자정까지만 포함될 수 있어요. 반대로 컬럼을 `DATE_FORMAT()`으로 감싸면 날짜 인덱스를 활용하기 어려워질 수 있습니다.

## 하루 전체는 다음 날 0시 미만으로

입력이 `YYYYMMDD` 문자열일 때 MariaDB의 `STR_TO_DATE`에는 **값과 형식 두 인자**가 필요합니다.

```sql
SELECT id, created_at
FROM orders
WHERE created_at >= STR_TO_DATE('20260901', '%Y%m%d')
  AND created_at < DATE_ADD(
      STR_TO_DATE('20260915', '%Y%m%d'),
      INTERVAL 1 DAY
  );
```

조건은 `2026-09-01 00:00:00` 이상, `2026-09-16 00:00:00` 미만입니다. 마이크로초가 있는 값도 15일 전체가 포함됩니다. `23:59:59`를 마지막 시각으로 가정할 필요가 없어요. `STR_TO_DATE('20260915')`처럼 형식 인자를 빼면 `Incorrect parameter count`가 납니다.

입력값은 SQL 문자열 결합으로 끼워 넣지 말고 바인딩하세요. 애플리케이션에서 날짜 형식을 먼저 검증한 뒤 날짜 타입 파라미터로 전달하면 더 명확합니다. 서버와 DB의 시간대가 다르면 경계값을 어느 시간대로 해석할지도 정해야 합니다.

## 두 기간이 겹치는지 확인하기

게시 기간이 `[published_from, published_to)`이고 검색 기간이 `[search_from, search_to)`라면 겹침 조건은 다음 두 줄입니다.

```sql
WHERE published_from < :search_to
  AND published_to > :search_from
```

게시 종료값을 **포함하는** 설계라면 두 번째 비교를 `published_to >= :search_from`으로 바꿔야 합니다. 경계 시각에 딱 맞닿는 경우를 포함할지부터 정하세요. 날짜 문자열로 입력받는 검색 종료일은 위 예처럼 다음 날 0시를 `:search_to`로 사용하면 됩니다.

게시 시작일과 종료일이 검색 범위 안에 있는지만 각각 검사하면, **검색 범위를 통째로 감싸는 긴 게시 기간**을 놓칠 수 있습니다. 겹침 공식을 쓰면 이 경우도 포함됩니다.

## 인덱스를 생각한 비교

```sql
-- 컬럼을 가공하므로 created_at 인덱스 활용에 불리할 수 있음
WHERE DATE_FORMAT(created_at, '%Y%m%d') = '20260915'

-- 컬럼은 그대로 두고 경계값을 계산
WHERE created_at >= '2026-09-15 00:00:00'
  AND created_at < '2026-09-16 00:00:00'
```

두 번째 형태가 일반적으로 인덱스 범위 검색에 유리합니다. 실제로 인덱스를 선택했는지는 `EXPLAIN`의 `key`와 `rows`를 확인하세요. 기간 겹침처럼 **두 컬럼을 함께 비교하는 경우**에는 인덱스 하나만 추가한다고 모든 조건이 동시에 빨라지는 것은 아닙니다. 데이터 분포와 다른 필터까지 포함해 실행 계획을 비교해야 합니다.

## 참고

- [MariaDB 문서: STR_TO_DATE](https://mariadb.com/docs/server/reference/sql-functions/date-time-functions/str_to_date)
