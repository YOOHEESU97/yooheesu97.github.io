---
title: 'MariaDB INSERT 오류: 빈 문자열, NULL, DECIMAL 구분하기'
description: '공백을 NULL로 바꿨는데도 INSERT가 실패할 때 컬럼 제약과 파라미터 타입을 확인하는 방법'
pubDate: 2026-10-11
publishedAt: 2026-10-11T23:17:14+09:00
category: sql
tags: ['mariadb', 'null', 'data-validation']
---

입력값이 비어 있을 때 `''`, `' '`, `NULL`은 서로 다른 값입니다. 이전 대화에서는 공백을 `NULL`로 치환했는데도 `Column ... cannot be null` 오류가 계속됐습니다. 이 경우 변환식만 고칠 일이 아니라 **대상 컬럼이 NULL을 허용하는지** 먼저 확인해야 합니다.

## 오류를 세 단계로 나눠 보기

```sql
SHOW COLUMNS FROM orders LIKE 'term_code';
SHOW COLUMNS FROM orders LIKE 'amount';
```

`Null`이 `NO`인 컬럼에는 `NULL`을 넣을 수 없습니다. 아래 식이 공백을 제대로 `NULL`로 바꿔도 INSERT는 실패합니다.

```sql
NULLIF(TRIM(:term_code), '')
```

`NULL`이 업무적으로 허용된다면 스키마 제약을 검토하고, 필수값이라면 입력 단계에서 거부하거나 **업무적으로 정해진 기본값**을 사용해야 합니다. 오류를 없애려고 임의의 `0`이나 `'N'`을 넣으면 데이터 뜻이 달라질 수 있습니다.

## 문자열과 숫자는 따로 검증하기

`CHAR(1)` 같은 문자열 컬럼에는 앞뒤 공백을 제거한 뒤 빈 값인지 판단할 수 있습니다.

```sql
-- 실제 INSERT에는 준비된 문장의 바인딩 파라미터를 사용
CASE
  WHEN TRIM(:term_code) = '' THEN NULL
  ELSE TRIM(:term_code)
END
```

하지만 `DECIMAL` 컬럼에 빈 문자열을 넣고 DB의 암묵적 숫자 변환에 기대면 SQL 모드와 입력 형식에 따라 오류 또는 원치 않는 값이 나올 수 있습니다. **애플리케이션에서 먼저 숫자 형식을 검사하고**, 빈 입력을 허용하는 컬럼이면 숫자 타입의 `NULL`을 바인딩하는 편이 분명합니다. 공백이 아닌 `12x`, 소수점 자리 초과, 음수 허용 여부도 같은 자리에서 검사합니다.

## 확인 순서

1. 실제 바인딩 값이 `NULL`, `''`, `' '` 중 무엇인지 로깅할 때 민감정보는 가립니다.
2. 대상 컬럼의 타입, `NOT NULL`, 기본값을 확인합니다.
3. 숫자 입력이라면 애플리케이션 검증 결과와 바인딩 타입을 확인합니다.
4. SQL 모드와 실제 DB 오류 메시지를 확인합니다.

`CASE`가 예상대로 동작해도 **스키마 제약을 통과한다는 뜻은 아닙니다**. 값 변환과 컬럼 허용 범위를 별개의 문제로 보면 원인을 더 빨리 찾을 수 있습니다.

## 참고

- [MariaDB 문서: NULL 값](https://mariadb.com/docs/server/reference/data-types/null-values)
- [MariaDB 문서: NOT NULL 제약](https://mariadb.com/docs/server/architecture/server-constraints/not-null-constraints)
