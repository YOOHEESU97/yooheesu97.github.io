---
title: 'Node.js Error: Cannot find module — 경로·설치·ESM 해결'
description: 'npm install 누락, 상대경로 오타, type module과 require 혼용'
pubDate: 2026-06-29
category: nodejs
tags: ['nodejs', 'npm', 'error']
---

Node 실행 시 가장 흔한 에러 중 하나입니다.

```
Error: Cannot find module './utils/logger'
```

모듈 해석이 실패했다는 뜻인데, 원인은 설치·경로·모듈 시스템(CJS/ESM) 중 하나입니다.

## 원인별 해결

### 1. 패키지 미설치

```bash
npm install
# 또는
npm ci
```

`node_modules`가 없거나 CI에서 cache가 깨졌을 때입니다.

```bash
rm -rf node_modules package-lock.json
npm install
```

### 2. 상대 경로·확장자 오타

```javascript
// ❌ 파일명 대소문자 (Linux CI에서만 실패)
import { log } from './Utils/logger.js';

// ✅
import { log } from './utils/logger.js';
```

ESM에서는 **확장자 `.js` 포함**이 필요한 경우가 많습니다 (`"type": "module"`).

### 3. CJS vs ESM

`package.json`:

```json
{ "type": "module" }
```

이면 `require()` 대신 `import`를 씁니다.

```javascript
// ❌ ESM 프로젝트
const fs = require('fs');

// ✅
import fs from 'node:fs';
```

반대로 CJS 프로젝트에서 top-level `import`는 `SyntaxError`가 납니다.

### 4. ts-node / 빌드 산출물

TypeScript는 **컴파일된 `dist/`**를 실행해야 할 수 있습니다.

```bash
npm run build
node dist/index.js
```

`ts-node` 개발, `node dist` 프로덕션으로 스크립트를 나눕니다.

### 5. monorepo workspace

루트가 아닌 패키지 폴더에서:

```bash
cd packages/api
npm install
npm run dev
```

workspace 패키지는 `package.json`의 `name`으로 import합니다.

```javascript
import { shared } from '@myorg/shared';
```

## 디버깅

```bash
node -e "console.log(require.resolve('express'))"
node --trace-warnings app.js
```

`require.resolve`로 Node가 어느 경로를 찾는지 확인합니다.

## 마무리

`Cannot find module`은 **설치 → 경로 → CJS/ESM → 빌드 산출물** 순으로 보면 대부분 해결됩니다. 로컬은 되는데 CI만 실패하면 대소문자와 `npm ci`를 먼저 의심하세요.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Node.js Modules](https://nodejs.org/api/modules.html)
- [Node.js ESM](https://nodejs.org/api/esm.html)
