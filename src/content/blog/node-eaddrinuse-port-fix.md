---
title: 'Node.js Error: listen EADDRINUSE — 포트 이미 사용 중 해결'
description: '3000/8080 포트 점유 프로세스 찾기, kill, 다른 포트로 기동'
pubDate: 2026-06-29
category: nodejs
tags: ['nodejs', 'express', 'port']
---

서버를 띄우다 보면:

```
Error: listen EADDRINUSE: address already in use :::3000
```

**해당 포트를 다른 프로세스가 이미 쓰고 있다**는 뜻입니다. 이전에 띄운 dev 서버가 안 죽었을 때 자주 봅니다.

## Linux / macOS — 프로세스 찾기

```bash
lsof -i :3000
# 또는
ss -tlnp | grep 3000
```

```bash
kill <PID>
# 안 죽으면
kill -9 <PID>
```

## Windows

```powershell
netstat -ano | findstr :3000
taskkill /PID <pid> /F
```

## 한 줄로 (Linux)

```bash
fuser -k 3000/tcp
```

## 다른 포트로 실행

```bash
PORT=3001 npm run dev
```

```javascript
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on ${port}`));
```

## nodemon / vite 중복 실행

터미널 탭마다 `npm run dev`를 켜 두면 같은 포트로 충돌합니다. 이전 세션을 종료하거나 tmux pane을 정리하세요.

## Docker

호스트 포트 매핑이 겹치면:

```yaml
ports:
  - "3001:3000"  # 호스트 3001 → 컨테이너 3000
```

## 마무리

`EADDRINUSE`는 포트 점유 문제입니다. `lsof`로 PID 확인 후 종료하거나 `PORT` 환경 변수로 바꾸면 끝납니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Node.js net.Server](https://nodejs.org/api/net.html#serverlisten)
