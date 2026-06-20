---
title: 'Astro로 개발자 블로그 만들기'
description: 'Jekyll, Hugo, Next.js와 비교했을 때 Astro를 선택한 이유'
pubDate: 2026-06-20
tags: ['astro', 'blog', 'github-pages']
---

코딩 노트용 블로그를 만들면서 Jekyll, Hugo, Next.js까지 비교해 봤는데, 결국 Astro로 갔습니다. "그냥 마크다운만 쓰면 되는 거 아닌가?" 싶었는데, 디자인이랑 확장성까지 생각하니 선택지가 꽤 많더라고요. 제가 고른 이유를 정리해 봅니다.

## Astro가 쓰는 기술

- **언어**: JavaScript / TypeScript (Node.js)
- **콘텐츠**: Markdown, MDX
- **UI**: `.astro` 컴포넌트 (+ 필요하면 React/Vue도 붙일 수 있음)
- **빌드 결과**: 정적 HTML (필요한 JS만 로드)

## 다른 선택지와 비교

| | Jekyll | Hugo | Astro | Next.js |
| --- | --- | --- | --- | --- |
| 핵심 언어 | Ruby | Go | JS/TS | JS/TS (React) |
| GitHub Pages | 기본 지원 쉬움 | Actions 필요 | Actions 필요 | static export + Actions |
| UI 자유도 | 낮음 | 중간 | 높음 | 매우 높음 |
| 난이도 | 낮음 | 중~낮음 | 중간 | 중~높음 |

## Astro를 고른 이유

1. **Markdown 기반**이라 코딩 노트 작성이 편합니다.
2. **미니멀 다크 테마**를 직접 손보기 좋았어요.
3. 나중에 **React 컴포넌트**를 붙이기도 수월합니다.
4. Jekyll보다 현대적이고, Next.js보다 가볍더라고요.

솔직히 "코딩 노트 + 미니멀 + 다크모드" 조합이면 Jekyll도 충분한데, React 쪽으로 확장할 여지가 있는 게 Astro가 끌렸습니다.

## GitHub Pages 배포

지금은 저장소 이름을 `yooheesu97.github.io`로 바꿔서 루트에 배포 중입니다. `astro.config.mjs`는 이렇게 맞춰 두었어요.

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://yooheesu97.github.io',
  base: '/',
});
```

GitHub Actions로 `npm run build` 후 `dist` 폴더를 Pages에 올리는 방식입니다. push만 하면 자동 배포되니까, 글 쓰는 데만 집중할 수 있어요.

## 마무리

블로그 스택 고를 때 "유행"보다 **글 쓰기 편한지, 배포가 귀찮지 않은지**가 제일 중요했습니다. Astro는 그 균형이 잘 맞더라고요. 비슷한 고민 하시는 분께 참고가 되면 좋겠습니다.
