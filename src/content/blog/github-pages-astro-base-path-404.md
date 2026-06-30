---
title: 'GitHub Pages 404 — Astro base 경로 맞추기'
description: 'user site vs project site, astro.config base, Actions 배포 후 404 해결'
pubDate: 2026-07-01
category: devops
tags: ['astro', 'github-pages', '404']
---

Astro 블로그를 GitHub Pages에 올렸는데 CSS가 깨지거나 새로고침하면 404가 나오면, 거의 항상 **`site` / `base` 설정과 저장소 URL 형식**이 안 맞는 경우입니다. 제 블로그도 `my-coding-notes` project site에서 `yooheesu97.github.io` user site로 바꾸면서 한번 크게 겪었어요.

## user site vs project site

| 저장소 이름 | 사이트 URL | `base` |
| --- | --- | --- |
| `username.github.io` | `https://username.github.io/` | `'/'` |
| `my-blog` (그 외) | `https://username.github.io/my-blog/` | `'/my-blog/'` |

user site인데 `base: '/repo-name/'`을 쓰면 링크가 전부 한 단계 밀립니다.

## astro.config.mjs 예시

**User site (루트 배포):**

```js
export default defineConfig({
  site: 'https://yooheesu97.github.io',
  base: '/',
});
```

**Project site:**

```js
export default defineConfig({
  site: 'https://yooheesu97.github.io',
  base: '/my-coding-notes/',
});
```

`site`는 canonical URL, `base`는 빌드 산출물이 붙는 경로 prefix입니다.

## 내부 링크는 withBase 사용

하드코딩 `/blog/` 대신 `import.meta.env.BASE_URL` 또는 헬퍼를 씁니다.

```ts
export function withBase(path = '') {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, '')}`;
}
```

이 블로그도 `src/utils/withBase.ts`로 통일해 두었습니다.

## GitHub Actions 배포

```yaml
- name: Build
  run: npm run build
- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: dist
```

Settings → Pages → Source를 **GitHub Actions**로 맞춥니다. `peaceiris/actions-gh-pages`를 쓸 때는 `publish_dir: dist`와 함께 `BASE_PATH` env가 `base`와 일치해야 합니다.

## 증상별 원인

| 증상 | 원인 |
| --- | --- |
| 홈은 되는데 `/blog/xxx` 새로고침 404 | SPA fallback 없음 (정적 사이트는 경로별 `index.html` 필요 — Astro는 빌드 시 생성) |
| CSS/JS 404 | `base` 불일치 |
| 이미지 깨짐 | `public/` 경로에 `base` 미반영 |
| 배포는 됐는데 예전 사이트 | 캐시·다른 브랜치 Pages 설정 |

## 체크리스트

- [ ] 저장소 이름 ↔ `base` 일치
- [ ] `site`에 https·도메인 정확히
- [ ] 내부 링크 `withBase()` 사용
- [ ] Actions가 `dist` 업로드하는지
- [ ] Pages 설정이 Actions 소스인지

## 마무리

GitHub Pages 404는 Astro 버그라기보다 **URL prefix 설정** 문제인 경우가 많습니다. 저장소 이름 바꾼 뒤에는 `base`와 `withBase`부터 다시 맞추면 됩니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Astro — Deploy to GitHub Pages](https://docs.astro.build/en/guides/deploy/github/)
- [GitHub Pages 문서](https://docs.github.com/en/pages)
