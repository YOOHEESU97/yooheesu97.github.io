---
title: 'React Hydration failed — Text content does not match server-rendered HTML'
description: 'SSR/Next/Astro+React에서 hydration mismatch 원인과 useEffect·suppressHydrationWarning'
pubDate: 2026-06-29
updatedDate: 2026-06-30
category: react
tags: ['react', 'ssr', 'hydration']
---

이 블로그를 Astro로 옮기면서 헤더에 다크 모드 토글을 React island로 붙였는데, 로컬에서는 멀쩡한데 배포 직후 콘솔에 hydration 경고가 잔뜩 떴습니다. 화면은 보이는데 글 목록 카드가 잠깐 깜빡이고, 새로고침할 때마다 같은 메시지가 반복됐어요.

```
Warning: Text content did not match. Server: "..." Client: "..."
Error: Hydration failed because the initial UI does not match what was rendered on the server.
```

원인을 찾아보니 `localStorage`에 저장된 테마 값을 **첫 렌더에서 바로 읽고 있었던 것**이었습니다. 서버는 기본 라이트 HTML을 보내는데, 클라이언트는 저장된 `dark` 클래스를 먼저 그리니 한 글자·한 클래스만 달라도 React가 hydration에 실패합니다.

## 흔한 원인

| 원인 | 예시 |
| --- | --- |
| 시간·난수 | `Date.now()`, `Math.random()` |
| 브라우저 전용 API | `window`, `localStorage`, `matchMedia` |
| 로케일 차이 | `toLocaleString()` 서버/클라 TZ 다름 |
| 조건부 렌더 | `typeof window !== 'undefined'` |
| 잘못된 HTML | `<p>` 안에 `<div>` — 브라우저가 DOM 수정 |
| 서버·클라 데이터 불일치 | 클라이언트만 재 fetch |

## 해결 1: 브라우저 전용 값은 useEffect

```tsx
function Clock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(new Date().toLocaleTimeString('ko-KR'));
  }, []);

  return <span>{time ?? '--:--:--'}</span>;
}
```

첫 렌더는 서버·클라 모두 `--:--:--`로 맞추고, 마운트 후에만 실제 시간을 넣습니다.

## 해결 2: mounted 플래그

```tsx
function ThemeLabel() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return <span>{localStorage.getItem('theme')}</span>;
}
```

다크모드 토글이 `localStorage`를 읽을 때 자주 씁니다.

## 해결 3: suppressHydrationWarning (최후 수단)

```tsx
<time suppressHydrationWarning>{new Date().toISOString()}</time>
```

**해당 노드 한 단계**만 경고를 끕니다. 남용하면 진짜 버그를 놓칩니다.

## 해결 4: 서버와 같은 데이터를 props로

```tsx
// 서버에서 fetch한 posts를 Astro/Next가 props로 전달
function PostList({ posts }: { posts: Post[] }) {
  return posts.map((p) => <article key={p.id}>{p.title}</article>);
}
```

클라이언트에서만 다시 fetch하면 첫 paint와 달라질 수 있습니다.

## 디버깅: hydrateRoot onRecoverableError

```tsx
import { hydrateRoot } from 'react-dom/client';

hydrateRoot(document.getElementById('root')!, <App />, {
  onRecoverableError(error, errorInfo) {
    console.error(error.message);
    console.error(errorInfo.componentStack);
  },
});
```

React 19 문서에도 hydration mismatch 디버깅 가이드가 추가되어 있으며, **componentStack**으로 범인 컴포넌트를 좁힐 수 있습니다.

## 체크리스트

- [ ] render 경로에 `window`/`document` 없음
- [ ] `Date`/`Math.random`은 effect 안
- [ ] 서버·클라 초기 props 동일
- [ ] HTML 중첩 유효성 (p > div 금지)
- [ ] third-party 스크립트가 root DOM을 건드리지 않음

## 마무리

Hydration 에러는 "SSR이 깨졌다"기보다 **첫 렌더를 서버와 맞추지 못했다**는 뜻입니다. 동적 값은 effect로 미루는 패턴이 제일 많이 썼습니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [React — hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)
- [React — suppressHydrationWarning](https://react.dev/reference/react-dom/client/hydrateRoot#suppressing-unavoidable-hydration-mismatch-errors)
