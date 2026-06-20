---
title: 'Astro 블로그 GitHub Pages 배포 — 오늘 겪은 문제들'
description: '404, AdSense 확인 실패, Custom domain 오해까지. 오늘 블로그 올리면서 막혔던 것과 해결 방법'
pubDate: 2026-06-20
tags: ['astro', 'github-pages', 'debug']
---

이번에 Astro로 코딩 노트 블로그를 만들고 GitHub Pages에 올리는 과정에서, 생각보다 많은 데에서 막혔습니다. 홈은 되는데 나머지는 404, AdSense는 확인 불가, Custom domain은 아예 다른 용도… 하나씩 겪어보니 해결법은 대부분 간단하더라고요. 같은 삽질 반복하지 않도록 정리해 봅니다.

## 1. 홈만 되고 나머지는 404

### 어떤 상황이었나

배포 직후 `yooheesu97.github.io/my-coding-notes/` 홈은 잘 열리는데, Notes·About·글 상세 페이지는 전부 404가 떴습니다. "배포는 됐는데 왜 절반만 되지?" 싶었어요.

### 원인

블로그가 **프로젝트 페이지**라서 실제 주소는 `/my-coding-notes/` 아래인데, 링크는 `/blog`, `/about`처럼 **루트 기준**으로 박혀 있었습니다.

| 클릭한 링크 | 실제로 가는 주소 | 결과 |
|---|---|---|
| `/blog` | `github.io/blog` | 404 |
| 올바른 경로 | `github.io/my-coding-notes/blog` | 정상 |

### 어떻게 해결했나

Astro `base` 설정(`/my-coding-notes`)에 맞게 내부 링크를 전부 손봤습니다. `import.meta.env.BASE_URL`을 쓰는 `withBase()` 헬퍼를 만들어 Header, Footer, 글 목록 링크에 적용했어요.

```ts
export function withBase(path: string = ''): string {
  const base = import.meta.env.BASE_URL;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  if (!path || path === '/') return normalizedBase;
  const clean = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}${clean}`;
}
```

---

## 2. GitHub Pages가 아예 안 켜짐

### 어떤 상황이었나

Settings → Pages에 들어갔더니 "Upgrade or make this repository public to enable Pages" 메시지만 보였습니다. 결제하라는 줄 알고 깜짝 놀랐어요.

### 원인

저장소가 **Private** 상태였습니다. 무료 GitHub 플랜에서는 Private repo에 Pages를 쓸 수 없더라고요.

### 어떻게 해결했나

결제가 필요한 게 아니었습니다. 저장소를 **Public**으로 바꾸면 끝입니다. (Settings → Danger Zone → Change visibility)

---

## 3. AdSense 사이트 확인 실패

### 어떤 상황이었나

AdSense 코드는 `<head>`에 넣었는데 "사이트를 확인할 수 없음"이 계속 떴습니다.

### 원인 (2가지)

1. AdSense에 **`yooheesu97.github.io`만** 등록해 둔 상태 → Google은 루트(`/`)를 확인하는데, 블로그와 코드는 `/my-coding-notes/` 아래에 있었습니다.
2. **`github.io`를 Custom domain에 넣으려 했음** → Custom domain은 `blog.com` 같은 **직접 산 도메인**용이지, GitHub 기본 주소용이 아니었어요.

### 어떻게 해결했나 (택 1)

- **서브경로 유지:** AdSense URL을 `yooheesu97.github.io/my-coding-notes`로 등록
- **루트로 옮기기:** 저장소 이름을 `yooheesu97.github.io`로 바꾸고 Astro `base: '/'` 설정 → AdSense URL은 `yooheesu97.github.io`

저는 후자로 진행했습니다. 루트 주소가 깔끔해서요.

---

## 4. 저장소 이름을 `yooheesu97.github.io`로 변경

### 어떤 상황이었나

`yooheesu97.github.io` 루트 주소로 블로그를 쓰고 싶어서 저장소 이름을 바꿨습니다.

### 수정한 것

**`astro.config.mjs`**

```js
export default defineConfig({
  site: 'https://yooheesu97.github.io',
  base: '/',
});
```

**GitHub Actions** — `BASE_PATH: /my-coding-notes` 환경변수 제거

이후 내부 링크는 `/blog`, `/about`처럼 루트 기준으로 잘 동작합니다.

---

## 다음에 배포할 때 체크리스트

1. 저장소 Public인지 확인
2. Pages Source가 **GitHub Actions**인지 확인
3. 프로젝트 페이지(`/repo-name/`)면 `base`와 **모든 내부 링크**가 일치하는지 확인
4. AdSense URL = **실제 블로그가 열리는 주소** 그대로 등록
5. `*.github.io`는 Custom domain 칸에 넣지 말 것

## 한 줄 정리

> GitHub Pages 404의 90%는 **base 경로와 링크 불일치**, AdSense 확인 실패는 **등록 URL과 실제 사이트 주소 불일치**였습니다. 둘 다 주소만 맞추면 생각보다 금방 풀리더라고요.
