---
title: 'React TypeError: Cannot read properties of undefined (reading map) 해결'
description: 'API 로딩 전 map 호출, useState 초기값, optional chaining으로 고치는 방법'
pubDate: 2026-07-01
category: react
tags: ['react', 'error', 'hooks']
---

React에서 리스트를 그릴 때 `TypeError: Cannot read properties of undefined (reading 'map')`는 정말 자주 봅니다. 에러 메시지 그대로 **undefined에 `.map()`을 호출**했다는 뜻인데, 대부분 fetch가 끝나기 전 첫 렌더에서 터집니다.

## 왜 첫 렌더에서 터지나

React는 동기적으로 렌더합니다. `useState()`만 쓰면 초기값이 `undefined`이고, 그 순간 JSX의 `items.map(...)`이 실행되면 바로 예외가 납니다. API 응답이 오기 전 **아주 짧은 순간**이라도 undefined면 앱 전체가 하얗게 될 수 있어요.

## 해결 1: useState 초기값을 빈 배열로

```tsx
const [users, setUsers] = useState<User[]>([]);

return (
  <ul>
    {users.map((user) => (
      <li key={user.id}>{user.name}</li>
    ))}
  </ul>
);
```

`useState<User[]>()`처럼 인자를 생략하지 않는 게 핵심입니다.

## 해결 2: optional chaining

```tsx
{users?.map((user) => (
  <li key={user.id}>{user.name}</li>
))}
```

`users`가 `null`/`undefined`면 `map` 자체를 건너뜁니다. 단, 로딩 중인지 빈 목록인지 구분은 안 됩니다.

## 해결 3: nullish coalescing

```tsx
{(users ?? []).map((user) => (
  <li key={user.id}>{user.name}</li>
))}
```

항상 배열에 `map`을 호출하되, undefined면 빈 배열로 대체합니다.

## 해결 4: loading 상태 분리 (추천)

```tsx
const [users, setUsers] = useState<User[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  fetch('/api/users')
    .then((res) => res.json())
    .then((data) => setUsers(data.items ?? data))
    .catch((e) => setError(e.message))
    .finally(() => setLoading(false));
}, []);

if (loading) return <p>Loading...</p>;
if (error) return <p>Error: {error}</p>;

return (
  <ul>
    {users.map((user) => (
      <li key={user.id}>{user.name}</li>
    ))}
  </ul>
);
```

실무에서는 이 패턴이 가장 읽기 좋았습니다.

## API 응답 shape 실수

서버가 배열이 아니라 객체를 주는 경우도 많아요.

```json
{ "data": [...], "total": 42 }
```

이때 `setUsers(data)`를 하면 `users`가 객체가 되어 `map`이 없습니다.

```tsx
setUsers(Array.isArray(data) ? data : data.data ?? []);
```

## props로 받을 때

부모가 prop을 안 넘기면 자식에서 동일한 에러가 납니다.

```tsx
type Props = { items?: Item[] };

function List({ items = [] }: Props) {
  return items.map((item) => <div key={item.id}>{item.name}</div>);
}
```

default parameter나 `items = []`로 방어합니다.

## 디버깅 순서

1. 에러 난 줄에서 `.map` **앞 변수** 확인
2. `useState` 초기값이 배열인지 확인
3. `console.log`로 fetch 직후 값 shape 확인
4. 부모→자식 prop 이름 일치 여부 확인

## 방지 체크리스트

- [ ] 리스트 state는 `useState<T[]>([])`
- [ ] API 파싱 시 `Array.isArray` 검사
- [ ] 로딩/에러 UI 분리
- [ ] TypeScript로 `undefined` prop 경고 잡기

## 마무리

이 에러는 React 초보가 아니라 **데이터 비동기**를 다룰 때 누구나 한 번씩 만납니다. 초기값·로딩 상태·응답 shape 세 가지만 챙겨도 재발이 확 줄어들더라고요.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [React docs — Keeping Components Pure](https://react.dev/learn/keeping-components-pure)
- [MDN — Array.prototype.map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map)
