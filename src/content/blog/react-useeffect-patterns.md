---
title: 'React useEffect 실무 패턴 정리'
description: '의존성 배열, 클린업, 데이터 페칭에서 자주 틀리는 부분을 예제로 정리'
pubDate: 2026-06-29
category: react
tags: ['react', 'hooks', 'frontend']
---

React에서 `useEffect`는 편한 만큼 헷갈리는 경우가 많습니다. "왜 두 번 호출되지?", "무한 루프인데?" 같은 상황을 몇 번 겪고 나니, 패턴을 정해두는 게 낫더라고요. 실무에서 자주 쓰는 형태만 정리해 봅니다.

## useEffect가 하는 일

렌더링 **이후**에 부수 효과(side effect)를 실행합니다. API 호출, 이벤트 구독, 타이머, DOM 직접 조작 등이 여기에 해당해요.

```tsx
useEffect(() => {
  document.title = `알림 ${count}건`;
}, [count]);
```

의존성 배열 `[count]`가 바뀔 때만 effect가 다시 실행됩니다.

## 패턴 1: 마운트 시 1회 실행

```tsx
useEffect(() => {
  analytics.init();
}, []);
```

빈 배열 `[]`은 마운트 시 한 번만 실행합니다. 초기 설정, 외부 SDK 로드에 씁니다.

## 패턴 2: 데이터 페칭

```tsx
useEffect(() => {
  let cancelled = false;

  async function load() {
    const res = await fetch(`/api/posts?tag=${tag}`);
    const data = await res.json();
    if (!cancelled) setPosts(data);
  }

  load();

  return () => {
    cancelled = true;
  };
}, [tag]);
```

`tag`가 바뀔 때마다 다시 요청합니다. **클린업에서 cancelled 플래그**를 두는 이유는, 이전 요청 응답이 늦게 도착해 state를 덮어쓰는 race condition을 막기 위해서예요.

## 패턴 3: 이벤트·구독 클린업

```tsx
useEffect(() => {
  function onResize() {
    setWidth(window.innerWidth);
  }

  window.addEventListener('resize', onResize);
  return () => window.removeEventListener('resize', onResize);
}, []);
```

구독·타이머·WebSocket은 **반드시 클린업**합니다. 안 하면 메모리 누수와 중복 핸들러가 남습니다.

## 의존성 배열에서 자주 하는 실수

| 실수 | 증상 | 대응 |
| --- | --- | --- |
| 객체/배열을 deps에 직접 넣음 | 매 렌더마다 effect 재실행 | `useMemo`로 안정화하거나 primitive 값만 deps에 |
| setState만 하는 effect에 state 누락 | stale closure | 함수형 업데이트 `setCount(c => c + 1)` 고려 |
| eslint 경고 무시 | 예측 불가 버그 | `react-hooks/exhaustive-deps` 규칙 따르기 |

## useEffect 대신 쓸 수 있는 경우

React 19 / 최신 패턴에서는 아래도 검토할 만합니다.

- **이벤트 핸들러 안에서 처리** — 사용자 클릭에 따른 API 호출은 effect가 아니라 핸들러가 맞는 경우가 많아요.
- **React Query / SWR** — 서버 상태는 전용 라이브러리가 캐시·재시도·중복 제거를 잘 해줍니다.
- **`useSyncExternalStore`** — 외부 스토어 구독이 주 목적일 때

## 디버깅 팁

1. effect 본문 맨 위에 `console.log('effect', deps)`를 잠깐 넣어 **실행 횟수**를 확인합니다.
2. Strict Mode에서 개발 환경 **이중 실행**은 정상입니다. 프로덕션과 다르게 느껴질 수 있어요.
3. 무한 루프면 deps 안에 effect에서 갱신하는 state가 들어갔는지 먼저 봅니다.

## 마무리

`useEffect`는 "렌더 결과를 화면에 맞추는 동기화 도구"에 가깝습니다. 모든 비동기 로직을 effect에 넣기보다, **언제 다시 실행돼야 하는지**를 deps 기준으로 먼저 정리하면 훨씬 덜 헷갈립니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.
