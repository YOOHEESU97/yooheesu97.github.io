---
title: 'TypeScript TS2339: Property does not exist on type — 속성 오류 해결'
description: 'optional chaining, type guard, interface 확장, API 응답 unknown 처리'
pubDate: 2026-07-02
category: typescript
tags: ['typescript', 'error', 'react']
---

```
error TS2339: Property 'email' does not exist on type 'User'.
```

컴파일 타임에 "그 타입에는 그 필드가 없다"고 막는 에러입니다. 런타임 버그를 미리 잡아 주지만, API 연동 때 자주 부딪힙니다.

## 케이스 1: 타입 정의 누락

```typescript
interface User {
  id: number;
  name: string;
}

const user: User = await fetchUser();
console.log(user.email); // TS2339
```

**해결:** 인터페이스에 필드 추가하거나 optional로.

```typescript
interface User {
  id: number;
  name: string;
  email?: string;
}
```

## 케이스 2: union에서 좁히기 전 접근

```typescript
type Result = { ok: true; data: User } | { ok: false; error: string };

function print(result: Result) {
  console.log(result.data.name); // TS2339 — ok false일 수 있음
}
```

```typescript
if (result.ok) {
  console.log(result.data.name);
}
```

## 케이스 3: API 응답 unknown

```typescript
const res = await fetch('/api/user');
const data = await res.json(); // any/unknown
console.log(data.email);
```

```typescript
interface UserDto {
  email: string;
}

function isUserDto(v: unknown): v is UserDto {
  return typeof v === 'object' && v !== null && 'email' in v;
}

const data: unknown = await res.json();
if (!isUserDto(data)) throw new Error('Invalid user');
console.log(data.email);
```

## 케이스 4: index signature

```typescript
const map: Record<string, number> = {};
console.log(map.foo.toFixed(2)); // number | undefined
```

```typescript
console.log(map.foo?.toFixed(2));
```

`noUncheckedIndexedAccess` 사용 시 더 엄격해집니다.

## 케이스 5: React props

```typescript
type Props = { user?: User };

function Profile({ user }: Props) {
  return <span>{user.name}</span>; // TS2339
}
```

```typescript
if (!user) return null;
return <span>{user.name}</span>;
```

## `as` 단언은 최후

```typescript
const user = data as User; // 빠르지만 위험
```

런타임 검증 없이 단언하면 TS2339만 없애고 버그는 남습니다.

## 마무리

TS2339는 타입 모델이 실제 데이터와 어긋났을 때 납니다. optional·union narrowing·unknown 가드 순으로 맞추면 `as` 없이도 깔끔하게 풀리더라고요.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [TypeScript — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
