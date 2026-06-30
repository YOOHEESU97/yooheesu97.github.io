---
title: 'TypeScript error TS2322 — Type X is not assignable to type Y 해결'
description: 'React props, useState 제네릭, API 응답 타입 불일치 때 나는 TS2322 고치기'
pubDate: 2026-07-01
category: typescript
tags: ['typescript', 'react', 'error']
---

TypeScript로 React 붙이다 보면 `TS2322: Type 'string | undefined' is not assignable to type 'string'` 같은 메시지를 자주 봅니다. 런타임은 되는데 빌드만 막히는 경우가 많아서, 패턴만 익혀 두면 대응이 빨라져요.

## TS2322가 말하는 것

어떤 값을 **더 좁은 타입이 필요한 자리**에 넣었다는 뜻입니다. `undefined` 가능성, union 누락, 잘못된 props 타입이 대표적이에요.

## 케이스 1: optional prop을 required에 전달

```tsx
type UserCardProps = { name: string };

function UserCard({ name }: UserCardProps) {
  return <p>{name}</p>;
}

// user.name이 string | undefined
<UserCard name={user.name} />  // TS2322
```

**해결:**

```tsx
<UserCard name={user.name ?? 'Unknown'} />

// 또는 props를 optional로
type UserCardProps = { name?: string };
```

## 케이스 2: useState 초기값과 제네릭 불일치

```tsx
const [id, setId] = useState<number>(undefined); // TS2322
```

```tsx
const [id, setId] = useState<number | undefined>(undefined);
// 또는
const [id, setId] = useState<number | null>(null);
```

## 케이스 3: fetch JSON을 any 없이 다루기

```tsx
type User = { id: number; name: string };

const res = await fetch('/api/user');
const data: User = await res.json(); // 런타임 보장 없음 — lint 경고
```

실무에서는 zod/io-ts로 파싱하거나, 최소한 타입 가드를 씁니다.

```tsx
function isUser(v: unknown): v is User {
  return typeof v === 'object' && v !== null && 'id' in v && 'name' in v;
}

const data = await res.json();
if (!isUser(data)) throw new Error('Invalid response');
setUser(data);
```

## 케이스 4: 이벤트 핸들러 타입

```tsx
const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// textarea에 그대로 쓰면 ChangeEvent 타입이 달라 TS2322
<textarea onChange={onChange} />
```

요소별로 이벤트 타입을 맞추거나 union을 씁니다.

```tsx
const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  setValue(e.target.value);
};
```

## 케이스 5: as const / 리터럴 union

```tsx
type Status = 'draft' | 'published';
const [status, setStatus] = useState('draft'); // string으로 넓혀짐

setStatus('published'); // ok
setStatus('archived');  // 런타임만 통과, strict하면 문제
```

```tsx
const [status, setStatus] = useState<Status>('draft');
```

## 고치기 우선순위

1. **타입을 넓히지 말고** 데이터를 좁히기 (가드, 기본값)
2. `as` 단언은 최후 수단
3. API 경계에서 한 번만 검증하고 내부는 신뢰

## strict 옵션과 함께 보면 좋은 설정

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

`noUncheckedIndexedAccess`를 켜면 `arr[0]`이 `T | undefined`가 되어 TS2322가 늘지만, 실제 버그를 미리 잡을 수 있습니다.

## 마무리

TS2322는 "타입 설계가 실제 데이터와 어긋난 지점"을 알려 줍니다. `undefined` 처리와 API 응답 타입부터 맞추면 같은 에러가 반복되는 일이 줄어들더라고요.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [TypeScript Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
