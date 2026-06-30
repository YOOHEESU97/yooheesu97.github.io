---
title: 'FastAPI 422 Unprocessable Entity — Pydantic validation 에러 해결'
description: 'detail 배열 읽는 법, json vs form, Optional 필드·타입 불일치 수정'
pubDate: 2026-06-29
category: python
tags: ['python', 'fastapi', 'pydantic']
---

FastAPI에서 요청이 핸들러에 도달하기 전에 막히면 **422 Unprocessable Entity**가 납니다. 문법(JSON 파싱)은 됐지만 **Pydantic 스키마와 의미가 안 맞을 때**예요.

## 응답 body 읽는 법

```json
{
  "detail": [
    {
      "loc": ["body", "email"],
      "msg": "Field required",
      "type": "missing"
    }
  ]
}
```

| 필드 | 의미 |
| --- | --- |
| `loc` | `body`, `query`, `path` + 필드 경로 |
| `msg` | 사람이 읽을 이유 |
| `type` | `missing`, `int_parsing`, `value_error` 등 |

**detail만 보면 고칠 필드가 바로 나옵니다.**

## 원인 1: form 대신 JSON 필요

```python
# ❌ requests
requests.post(url, data={"email": "a@b.com"})

# ✅
requests.post(url, json={"email": "a@b.com"})
```

`data=`는 `application/x-www-form-urlencoded`입니다.

## 원인 2: 필수 필드 누락

```python
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    age: int
```

Optional로 바꿀 때:

```python
from typing import Optional

class UserCreate(BaseModel):
    email: EmailStr
    nickname: Optional[str] = None
```

Pydantic v2에서는 `str | None = None`도 동일합니다.

## 원인 3: 타입 불일치

```json
{ "age": "30" }
```

`age: int`면 422. 클라이언트에서 숫자로 보내거나 모델에서 `field_validator`로 변환합니다.

## 원인 4: 필드명 대소문자

JSON 키는 **대소문자 구분**합니다. `userName` vs `username`.

## 원인 5: extra 필드

```python
from pydantic import ConfigDict

class StrictUser(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: str
```

정의 안 한 필드가 오면 422 (`extra_forbidden`).

## curl로 재현

```bash
curl -X POST http://localhost:8000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","age":30}'
```

## 커스텀 422 응답 (선택)

```python
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_handler(request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"errors": exc.errors()})
```

## 마무리

422는 FastAPI가 **잘못된 입력을 걸러낸 것**입니다. `detail[0].loc`와 `type`을 보고 클라이언트 payload 또는 Pydantic 모델을 맞추면 됩니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [FastAPI — Request Body](https://fastapi.tiangolo.com/tutorial/body/)
- [Pydantic v2 Validation](https://docs.pydantic.dev/latest/concepts/validation/)
