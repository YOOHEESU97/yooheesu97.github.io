---
title: 'Astro로 개발자 블로그 만들기'
description: 'Jekyll, Hugo, Next.js와 비교했을 때 Astro를 선택한 이유'
pubDate: 2026-06-20
tags: ['astro', 'blog', 'github-pages']
---

이 블로그는 Astro로 만들었습니다. 정적 사이트 생성기(SSG) 중에서 Astro를 고른 이유를 정리합니다.

## Astro가 쓰는 기술

- **언어**: JavaScript / TypeScript (Node.js)
- **콘텐츠**: Markdown, MDX
- **UI**: `.astro` 컴포넌트 (+ 선택적으로 React/Vue)
- **빌드 결과**: 정적 HTML (필요한 JS만 로드)

## 다른 선택지와 비교

| | Jekyll | Hugo | Astro | Next.js |
| --- | --- | --- | --- | --- |
| 핵심 언어 | Ruby | Go | JS/TS | JS/TS (React) |
| GitHub Pages | 기본 지원 쉬움 | Actions 필요 | Actions 필요 | static export + Actions |
| UI 자유도 | 낮음 | 중간 | 높음 | 매우 높음 |
| 난이도 | 낮음 | 중~낮음 | 중간 | 중~높음 |

## Astro를 고른 이유

1. **Markdown 기반**으로 코딩 노트 작성이 편함
2. **미니멀 다크 테마**를 직접 디자인하기 쉬움
3. 나중에 **React 컴포넌트**를 붙이기도 수월함
4. Jekyll보다 현대적이고, Next.js보다 가벼움

## GitHub Pages 배포

프로젝트 페이지(`username.github.io/repo-name`)는 `base` 경로 설정이 필요합니다.

```js
// astro.config.mjs
export default defineConfig({
  site: 'https://yooheesu97.github.io',
  base: '/',
});
```

GitHub Actions로 `npm run build` 후 `dist` 폴더를 Pages에 배포합니다.
