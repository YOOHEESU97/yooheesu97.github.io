---
title: 'React Too many re-renders — 무한 렌더 루프 고치기'
description: 'setState를 render body에서 호출하거나 useEffect deps가 잘못됐을 때 나는 에러 해결'
pubDate: 2026-07-01
category: react
tags: ['react', 'error', 'hooks']
---

`Too many re-renders. React limits the number of renders to prevent an infinite loop.` 메시지를 보면 보통 **렌더 중에 state가 또 바뀌고 있다**는 뜻입니다. useEffect 없이도 터질 수 있어서, 처음엔 원인 찾기가 까다롭더라고요.

## 패턴 1: 렌더 본문에서 setState 호출

```tsx
// ❌ 매 렌더마다 setCount 실행 → 무한 루프
function Counter() {
  const [count, setCount] = useState(0);
  setCount(count + 1);
  return <div>{count}</div>;
}
```

`setState`는 이벤트 핸들러나 `useEffect` 안에서만 호출합니다.

## 패턴 2: onClick에 함수 호출 결과를 넘김

```tsx
// ❌ 클릭이 아니라 렌더 시 즉시 실행됨
<button onClick={handleSave()}>Save</button>

// ✅ 함수 참조 전달
<button onClick={handleSave}>Save</button>
<button onClick={() => handleSave(id)}>Save</button>
```

괄호 `()`를 붙이면 **렌더할 때마다** 함수가 실행됩니다.

## 패턴 3: useEffect deps에 객체/함수

```tsx
const filters = { status: 'active' };

useEffect(() => {
  fetchList(filters);
}, [filters]); // 매 렌더마다 새 객체 → effect 재실행 → setState → 루프
```

**고치기:**

```tsx
const filters = useMemo(() => ({ status: 'active' }), []);
// 또는 primitive만 deps에
useEffect(() => {
  fetchList(status);
}, [status]);
```

## 패턴 4: effect 안에서 조건 없이 setState

```tsx
useEffect(() => {
  setOpen(true); // deps가 state에 묶여 있으면 루프
}, [open]);
```

의도가 "마운트 시 한 번"이면 `[]` deps를 쓰거나, 조건을 넣습니다.

```tsx
useEffect(() => {
  if (!open) setOpen(true);
}, []); // 정말 한 번만 필요할 때
```

## 패턴 5: Context value가 매번 새 객체

```tsx
// ❌ Provider가 리렌더될 때마다 value 참조 변경
<MyContext.Provider value={{ user, token }}>

// ✅ useMemo로 안정화
const value = useMemo(() => ({ user, token }), [user, token]);
<MyContext.Provider value={value}>
```

하위 트리 전체가 불필요하게 리렌더되거나, effect가 연쇄적으로 돌 수 있습니다.

## 디버깅 방법

1. React DevTools **Profiler**로 어떤 컴포넌트가 반복 렌더되는지 확인
2. 의심되는 `setState` 위에 `console.trace()` 
3. `useEffect`마다 deps 배열을 적어 두고 eslint `exhaustive-deps` 유지

## 증상별 요약표

| 증상 | 흔한 원인 | 수정 |
| --- | --- | --- |
| 마운트 직후 즉시 에러 | render 중 setState | effect/이벤트로 이동 |
| 버튼 누르기 전 에러 | `onClick={fn()}` | `onClick={fn}` |
| fetch 후 루프 | deps에 객체 | primitive / useMemo |
| Context 사용 시 | value 매번 새 참조 | useMemo |

## 마무리

무한 렌더는 React가 막아 주는 친절한 신호입니다. **setState가 어디서 호출되는지**, **deps가 매 렌더 바뀌는지**만 추적해도 대부분 금방 끝납니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [React docs — useEffect](https://react.dev/reference/react/useEffect)
- [React docs — You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
