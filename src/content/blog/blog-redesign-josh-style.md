---
title: '블로그 디자인 손본 기록 — 카드, 다크모드, 코드 하이라이트'
description: 'Josh W. Comeau 블로그를 참고해 Astro 코딩 노트 사이트를 꾸민 과정과 적용한 설정'
pubDate: 2026-06-21
tags: ['astro', 'css', 'blog']
---

Coding Notes를 처음 올렸을 때는 GitHub 다크 톤에 글 목록만 있는 정도였습니다. 동작은 문제없는데, 솔직히 "노트 저장소" 느낌이 강해서 블로그 같지는 않더라고요. [Josh W. Comeau 블로그](https://www.joshwcomeau.com/blog/)를 보면서 "이 정도 여백과 카드 느낌이면 읽기 편하겠다" 싶어서, 오늘 UI를 한번 손봤습니다.

## 바꾸고 싶었던 것

| Before | After |
| --- | --- |
| 어두운 단색 배경 + 리스트 | 밝은 배경 + 2열 카드 그리드 |
| 시스템 폰트 | Plus Jakarta Sans + Noto Sans KR |
| 코드 블록 단색 | Shiki syntax highlight |
| 테마 고정 | 라이트/다크 토글 |

"완전 똑같이" 만드는 건 목표가 아니었습니다. **글 목록이 한눈에 들어오고, 코드가 읽히고, 밤에 봐도 눈이 덜 아픈 것** 정도만 맞추려고 했어요.

## 1. 카드형 글 목록

글 목록을 `<ul>` border 스타일에서 `PostCard` 컴포넌트 + CSS Grid로 바꿨습니다.

- 데스크톱: 2열
- 모바일: 1열
- 카드 안에 제목, 날짜, 태그, 요약, `더 읽기 →`

Josh 블로그처럼 카드에 살짝 그림자를 주고, hover 시 `translateY(-2px)` 정도만 올렸습니다. 애니메이션은 과하면 오히려 거슬려서 최소로 뒀어요.

## 2. 구름 헤더

헤더 아래에 SVG 원형을 겹쳐 구름처럼 보이게 했습니다. `fill="var(--bg)"`로 페이지 배경색과 맞춰서, 헤더 블루 톤에서 본문 영역으로 자연스럽게 이어지게 했어요.

다크 모드에서도 같은 방식으로 `--bg`만 바뀌면 되니까, 별도 이미지 없이 CSS 변수로 처리할 수 있었습니다.

## 3. 다크 모드 토글

`html[data-theme="light|dark"]` + CSS 변수 조합으로 테마를 나눴습니다.

- `<head>` 맨 앞에 inline script로 저장된 테마를 먼저 적용 → 새로고침할 때 깜빡임 줄이기
- `localStorage`에 `theme` 저장
- 처음 방문 시에는 `prefers-color-scheme` 따르기

토글 버튼은 헤더 nav 오른쪽에 두었습니다. Josh 사이트처럼 아이콘 하나로 라이트/다크를 바꾸는 정도면 충분하더라고요.

## 4. Shiki 코드 하이라이트

개발 노트 블로그인데 코드가 단색이면 아쉽습니다. Astro 기본 Shiki 설정만 추가했어요.

```js
// astro.config.mjs
markdown: {
  shikiConfig: {
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    wrap: true,
  },
},
```

다크 모드일 때는 CSS로 `.astro-code span`에 `var(--shiki-dark)`를 적용합니다. 라이트 모드는 Shiki가 inline color로 넣어 주니까, 불필요한 override는 넣지 않았어요.

## CSS 변수 구조

색상은 전부 `:root`와 `html[data-theme='dark']`에 모아 두었습니다.

```css
:root {
  --bg: #e8eef5;
  --bg-card: #ffffff;
  --accent: #2563eb;
  /* ... */
}

html[data-theme='dark'] {
  --bg: #0d1117;
  --bg-card: #161b22;
  --accent: #58a6ff;
  /* ... */
}
```

컴포넌트마다 색을 하드코딩하지 않으니, 나중에 accent 색만 바꿔도 사이트 전체 톤을 맞출 수 있습니다.

## 참고한 사이트

- [Josh W. Comeau — Blog](https://www.joshwcomeau.com/blog/) — 카드 레이아웃, 헤더 톤, `Read more` 패턴
- [Astro Themes](https://astro.build/themes/) — AstroPaper, Cactus 같은 블로그 테마 구조

레퍼런스는 "그대로 복붙"보다 **레이아웃·여백·타이포 계층**만 가져오는 게 현실적이었습니다. Josh 사이트 수준의 인터랙션까지 넣으려면 시간이 꽤 들더라고요.

## 마무리

블로그 꾸미기는 한 번에 끝나는 작업이 아닌 것 같아요. 오늘은 목록·테마·코드 가독성 세 가지만 맞췄고, 다음엔 태그 필터나 글 검색 정도를 붙여볼 생각입니다. 비슷한 노트 블로그 만들고 계신 분께 참고가 되면 좋겠습니다.
