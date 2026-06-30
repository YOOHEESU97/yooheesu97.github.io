# Coding Notes

Astro 기반 개발자 코딩 노트 블로그입니다. 다크모드 미니멀 디자인으로 GitHub Pages에 배포합니다.

**배포 URL:** https://yooheesu97.github.io/

## 로컬 개발

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:4321/ 로 접속합니다.

## 글 작성

`src/content/blog/` 폴더에 Markdown 파일을 추가합니다.

```md
---
title: '글 제목'
description: '짧은 설명'
pubDate: 2026-06-20
tags: ['tag1', 'tag2']
---

본문 내용...
```

## 빌드

```bash
npm run build
npm run preview
```

## GitHub Pages 배포

1. GitHub 저장소 **Settings → Pages**에서 Source를 **GitHub Actions**로 설정
2. `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동 배포

## 스택

- [Astro](https://astro.build/)
- Markdown Content Collections
- [MDX](https://mdxjs.com/)
- GitHub Actions + GitHub Pages
