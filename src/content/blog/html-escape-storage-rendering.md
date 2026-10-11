---
title: 'DB에 저장한 특수문자가 HTML 엔티티로 보일 때'
description: 'HTML 이스케이프가 저장 단계인지 출력 단계인지 구분하고 중복 이스케이프를 피하는 방법'
pubDate: 2026-10-11
publishedAt: 2026-10-11T23:17:14+09:00
category: spring
tags: ['html-escape', 'jsp', 'xss']
---

화면에 `<`를 입력했는데 다시 조회하면 `&lt;`로 보인다는 질문이 있었습니다. **DB에 실제로 `&lt;`가 저장된 것인지, 화면에 출력하면서 바뀐 것인지** 먼저 나눠 봐야 합니다. 두 상황의 해결 방법이 다릅니다.

## 저장값부터 확인하기

DB 클라이언트에서 해당 컬럼을 직접 조회합니다. 예제에는 임의의 테이블명을 사용했습니다.

```sql
SELECT id, content
FROM notes
WHERE id = :id;
```

- DB 값이 `<`라면 저장은 원문 그대로이고, 출력 과정에서 HTML 이스케이프가 적용됐을 수 있습니다.
- DB 값이 `&lt;`라면 저장하기 전 어느 단계에서 변환했는지 확인합니다.

`<`를 `&lt;`로 바꾸는 것은 HTML에서 문자를 안전하게 표시하기 위한 처리입니다. DB의 일반적인 `INSERT`가 자동으로 이런 변환을 하는 것은 아닙니다. Java 코드의 `HtmlUtils.htmlEscape(...)`, 이스케이프 유틸리티, 입력 필터 등을 확인하세요.

## 출력 단계에서 확인할 곳

JSP의 `<c:out>`은 기본적으로 XML/HTML 특수문자를 이스케이프합니다.

```html
<c:out value="${note.content}" />
```

DB에 `<`가 저장돼 있다면 이스케이프된 HTML 소스가 브라우저에서 **문자 `<`로 표시되는 것이 정상**입니다. HTML 소스를 검사했을 때 `&lt;`가 보이는 것과 화면에 문자 그대로 `&lt;`가 보이는 것은 다릅니다.

화면에 문자 그대로 `&lt;`가 보인다면 저장 전에 이미 `&lt;`로 바뀐 값이 출력 단계에서 다시 이스케이프돼 `&amp;lt;`가 되었는지 확인하세요. 이중 이스케이프가 흔한 원인입니다.

사용자 입력을 HTML로 해석시키려고 무조건 이스케이프를 끄면 XSS 위험이 생깁니다. 일반 텍스트는 원문으로 저장하고, **표시하는 HTML 문맥에서 이스케이프**하는 원칙을 먼저 적용하세요. 제한된 HTML을 허용하는 기능이라면 허용 태그를 정해 별도 정제 정책을 설계해야 합니다.

## 참고

- [OWASP: Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet)
