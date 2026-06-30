---
title: 'GitHub Actions npm ci 실패 — cache·lockfile·Node 버전 맞추기'
description: 'package-lock 불일치, actions/setup-node cache, engines 필드로 CI 안정화'
pubDate: 2026-06-29
category: devops
tags: ['github-actions', 'npm', 'ci']
---

GitHub Actions에서 배포 워크플로가 `npm ci` 단계에서 자주 깨집니다.

```
npm ERR! `npm ci` can only install packages when your package.json and package-lock.json are in sync
```

로컬에서는 되는데 CI만 실패할 때 점검할 목록입니다.

## 1. lockfile 동기화

```bash
npm install
git add package-lock.json
git commit -m "chore: sync package-lock.json"
```

`package.json`만 바꾸고 lock을 안 올리면 `npm ci`가 거부합니다.

## 2. setup-node + cache

```yaml
- uses: actions/checkout@v4

- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'

- run: npm ci
- run: npm run build
```

`cache: npm`은 lockfile 기준으로 `node_modules`를 캐시해 **설치 시간을 줄입니다.** lock이 바뀌면 캐시가 무효화됩니다.

## 3. Node 버전 engines

`package.json`:

```json
{
  "engines": {
    "node": ">=22.12.0"
  }
}
```

워크플로 `node-version`과 맞춥니다. Astro 6은 Node 22+를 요구하는 경우가 있습니다.

## 4. npm ci vs npm install

| 명령 | 용도 |
| --- | --- |
| `npm ci` | CI — lock 그대로, 재현성 |
| `npm install` | 로컬 — lock 갱신 가능 |

CI에는 `npm ci`만 쓰는 편이 안전합니다.

## 5. private registry / auth

```yaml
- run: npm ci
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

scoped 패키지는 `.npmrc`와 secret이 필요합니다.

## 6. 캐시 꼬임 의심 시

```yaml
- run: npm ci
```

캐시를 잠깐 끄거나 workflow에 `cache: npm` 제거 후 재실행해 원인 분리합니다.

## 이 블로그 워크플로 예시

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
```

## 마무리

Actions npm 실패는 대부분 **lock 불일치·Node 버전·캐시**입니다. 로컬에서 `npm ci`를 한 번 돌려 보고 통과하는 lock을 push하면 CI도 따라옵니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [GitHub Actions — setup-node](https://github.com/actions/setup-node)
- [npm ci docs](https://docs.npmjs.com/cli/v10/commands/npm-ci)
