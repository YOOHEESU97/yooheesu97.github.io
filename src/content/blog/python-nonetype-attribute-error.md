---
title: 'Python AttributeError: NoneType object has no attribute — None 체크 패턴'
description: 'Optional 반환, dict.get, ORM 쿼리 결과 None에서 나는 AttributeError 해결'
pubDate: 2026-06-29
category: python
tags: ['python', 'error', 'debug']
---

```
AttributeError: 'NoneType' object has no attribute 'name'
```

`None`인 값에 `.name` 같은 속성을 읽을 때 납니다. Java의 NPE와 비슷한데, Python은 런타임에 터집니다.

## 흔한 발생 지점

```python
user = db.get_user(user_id)  # 없으면 None
print(user.name)             # AttributeError
```

```python
config = os.environ.get("API_KEY")
print(config.strip())        # None이면 터짐
```

```python
data = response.json()
title = data["post"]["title"]  # 중간 키가 없으면 None 또는 KeyError
```

## 해결 1: 명시적 None 검사

```python
user = db.get_user(user_id)
if user is None:
    raise HTTPException(status_code=404, detail="User not found")
return user.name
```

## 해결 2: Optional 타입 힌트 + early return

```python
from typing import Optional

def display_name(user: Optional[User]) -> str:
    if not user:
        return "Guest"
    return user.name
```

## 해결 3: getattr 기본값

```python
name = getattr(user, "name", "Unknown")
```

남용하면 타입 안전성이 떨어지니 API 경계·레거시 코드에만 씁니다.

## 해결 4: dict 안전 접근

```python
title = (data.get("post") or {}).get("title")
# 또는
from typing import Any
post: Any = data.get("post")
title = post.get("title") if isinstance(post, dict) else None
```

## 해결 5: SQLAlchemy / ORM

```python
user = session.get(User, user_id)
if user is None:
    ...
```

`.first()`는 없으면 `None`, `.one()`은 없으면 예외 — 의도에 맞게 선택합니다.

## FastAPI와 함께

```python
@app.get("/users/{user_id}")
def get_user(user_id: int, session: Session = Depends(get_db)):
    user = session.get(User, user_id)
    if user is None:
        raise HTTPException(404)
    return user
```

## 방지: mypy / pyright

```python
def find_user(uid: int) -> User | None:
    ...
```

호출부에서 None 가능성을 타입 체커가 잡아 줍니다.

## 마무리

`NoneType` AttributeError는 "여기 None 올 수 있다"는 걸 코드가 인정하지 않을 때 납니다. DB 조회·env·JSON 파싱 직후에 **None 분기**를 두는 습관이 제일 효과적이었습니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Python — Optional types](https://docs.python.org/3/library/typing.html)
