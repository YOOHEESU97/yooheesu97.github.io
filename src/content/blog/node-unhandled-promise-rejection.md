---
title: 'Node.js UnhandledPromiseRejectionWarning — async await 빠진 catch'
description: 'Promise rejection 미처리, async route handler, process.on unhandledRejection'
pubDate: 2026-06-29
category: nodejs
tags: ['nodejs', 'promise', 'async']
---

Node 15+에서는 처리되지 않은 Promise rejection이 **프로세스 종료**로 이어질 수 있습니다.

```
UnhandledPromiseRejectionWarning: Error: ...
(node:12345) UnhandledPromiseRejectionWarning
```

`async` 함수에서 `throw`했는데 `await`/`catch`가 없을 때 흔합니다.

## 패턴 1: async 함수에 await 없음

```javascript
// ❌
function load() {
  fetchData();  // Promise 반환, 에러 무시
}

// ✅
async function load() {
  try {
    await fetchData();
  } catch (err) {
    console.error(err);
  }
}
```

## 패턴 2: Express async 라우트

```javascript
// ❌ 에러가 Express까지 안 올라감
app.get('/users', async (req, res) => {
  const users = await db.getUsers();
  res.json(users);
});

// ✅ 래퍼 사용
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

app.get('/users', asyncHandler(async (req, res) => {
  const users = await db.getUsers();
  res.json(users);
}));
```

Express 5는 async 에러를 자동으로 `next(err)`에 넘깁니다. Express 4는 래퍼가 필요합니다.

## 패턴 3: .then()만 쓰고 catch 누락

```javascript
// ❌
doWork().then((result) => save(result));

// ✅
doWork()
  .then((result) => save(result))
  .catch((err) => console.error(err));
```

## 패턴 4: Promise.all 중 하나 실패

```javascript
const results = await Promise.allSettled(tasks);
for (const r of results) {
  if (r.status === 'rejected') console.error(r.reason);
}
```

전부 실패해야 할 때만 `Promise.all`을 씁니다.

## 전역 핸들러 (최후 방어)

```javascript
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
```

로깅용으로는 쓰되, **비즈니스 로직 에러 처리 대체는 안 됩니다.**

## 마무리

Unhandled rejection은 "어딘가 async인데 catch가 없다"는 신호입니다. `async` 라우트는 래퍼로, 스크립트는 top-level `await` + try/catch로 막으면 안정적이었습니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Node.js — Process warning events](https://nodejs.org/api/process.html#event-unhandledrejection)
