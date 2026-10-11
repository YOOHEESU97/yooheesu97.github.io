---
title: '월별 데이터 이관이 느릴 때: EXPLAIN과 복합 인덱스 확인'
description: '월 단위 배치 조회에서 스캔 범위를 줄이고 이관 결과를 검증하는 순서'
pubDate: 2026-10-11
category: sql
tags: ['mariadb', 'index', 'data-migration']
---

월별로 원본 데이터를 읽어 새 테이블에 넣는 작업에서, 한 달치 조회가 예상보다 오래 걸릴 수 있습니다. 이전 대화에서는 **기준년월 조건을 안쪽 조회에 넣자 읽는 행이 크게 줄어든 사례**가 있었습니다. 수치만 보고 곧바로 배치 전체가 빨라졌다고 결론 내리기보다, 실행 계획과 실제 소요 시간을 함께 봐야 합니다.

아래는 회사 테이블명과 업무 값을 뺀 예시입니다.

## 필터를 원본을 읽는 곳에 놓기

```sql
SELECT s.id, s.account_id, s.amount
FROM source_transactions AS s
WHERE s.base_month = '202609'
  AND s.id > :last_id
ORDER BY s.id
LIMIT 1000;
```

`base_month`가 `CHAR(6)`이고 값이 항상 `YYYYMM`으로 정규화돼 있다면 문자열 동등 비교가 가능합니다. `DATE_FORMAT(s.created_at, '%Y%m') = '202609'`처럼 컬럼에 함수를 씌우는 방법과는 성격이 다릅니다. 월 필터가 서브쿼리 바깥에만 있다면 옵티마이저가 안쪽까지 밀어 넣는지 실행 계획으로 확인하세요.

## EXPLAIN에서 볼 것

```sql
EXPLAIN
SELECT s.id, s.account_id, s.amount
FROM source_transactions AS s
WHERE s.base_month = '202609'
  AND s.id > 50000
ORDER BY s.id
LIMIT 1000;
```

`possible_keys`는 후보, `key`는 선택된 인덱스입니다. `rows`는 예상 읽기량이라 실제 처리 건수와 다를 수 있습니다. `type`, `Extra`의 정렬·임시 테이블 신호도 같이 봅니다. 인덱스가 **선택됐다**는 사실만으로 충분하지 않습니다. 선택된 인덱스로도 너무 많은 행을 읽는다면 효과가 작습니다.

이 패턴에는 `(base_month, id)` 복합 인덱스를 검토할 수 있습니다. 첫 컬럼을 동등 조건으로 좁히고 다음 컬럼으로 ID 범위와 정렬을 처리하는 형태입니다. 이미 유사한 인덱스가 있는지 `SHOW INDEX FROM source_transactions;`로 확인하고, 운영 환경의 쓰기 비용과 저장 공간도 고려하세요. 인덱스 컬럼이 많다고 언제나 더 빠른 것은 아닙니다.

## 배치를 나눌 때 결과 검증

`OFFSET`을 페이지마다 크게 늘리는 방식은 뒤로 갈수록 건너뛰는 행이 많아질 수 있습니다. 고유한 `id`로 `id > :last_id`를 이어가는 키셋 방식은 큰 배치에 유용합니다. 단, 이관 중 원본에 행이 추가되거나 수정될 수 있다면 **어느 시점의 데이터까지 옮길지** 상한과 재실행 정책을 정해야 합니다.

이관은 속도뿐 아니라 누락·중복도 확인해야 합니다. 월별 원본 건수와 대상 건수를 비교하고, 대상 테이블의 중복 방지 키를 정한 뒤 실패한 배치를 다시 실행해도 안전한지 점검합니다. `FOREIGN_KEY_CHECKS`나 `UNIQUE_CHECKS`를 무턱대고 끄는 방식은 이 검증을 어렵게 만들 수 있습니다.

## 참고

- [MariaDB 문서: 복합 인덱스](https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/compound-composite-indexes)
- [MariaDB 문서: EXPLAIN](https://mariadb.com/docs/server/reference/sql-statements/administrative-sql-statements/analyze-and-explain-statements/explain)
