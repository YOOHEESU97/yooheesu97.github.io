---
title: 'Hermes Agent gateway 연결 — Telegram 봇이 무응답일 때'
description: 'gateway status, 로그, 토큰·systemd 설정으로 Telegram 연동 디버깅'
pubDate: 2026-07-01
category: hermes-agent
tags: ['hermes', 'telegram', 'gateway']
---

Hermes CLI에서 `hermes chat`은 되는데 Telegram 봇만 침묵할 때가 있습니다. CLI 레이어와 gateway 레이어가 **설정 파일·프로세스·토큰**을 공유하지만 동작 경로가 달라서, 한쪽만 되는 상황이 자주 나와요.

## 먼저 확인할 명령

```bash
hermes gateway status
tail -30 ~/.hermes/logs/gateway.log
systemctl --user status hermes-gateway   # user 서비스 사용 시
```

`status`가 disconnected이거나 로그에 crash loop가 보이면 CLI와 별개로 gateway만 고치면 됩니다.

## 원인 1: BotFather 토큰 오류

- 토큰 앞뒤 공백·줄바꿈
- 다른 봇 토큰을 `.env`에 넣음
- 토큰 revoke 후 갱신 안 함

토큰은 다시 발급받고 gateway 설정을 업데이트한 뒤 재시작합니다.

## 원인 2: CLI와 gateway가 다른 설정 읽음

```bash
hermes config path
hermes config env-path
```

systemd로 gateway를 띄우면 **서비스 유저** 기준 경로가 달라질 수 있습니다. root로 서비스를 돌리는데 키는 일반 유저 홈에만 있으면 CLI만 됩니다.

```ini
# ~/.config/systemd/user/hermes-gateway.service 예시
[Service]
EnvironmentFile=%h/.hermes/.env
ExecStart=%h/.hermes/bin/hermes gateway start
```

## 원인 3: 소스 clone 폴더에서 gateway 실행

clone 디렉터리에서 직접 띄우면 경로·설정이 꼬이는 경우가 있습니다. **설치된 `~/.hermes` 환경**에서 gateway를 실행하는 게 안전해요.

## 원인 4: 세션/도구 변경 후 gateway 미반영

도구(toolset) 설정을 바꾼 뒤 gateway 프로세스는 예전 세션을 들고 있을 수 있습니다.

```bash
hermes gateway restart
# 또는
systemctl --user restart hermes-gateway
```

CLI에서 `/reset`한 것과 gateway 프로세스는 별개입니다.

## 원인 5: 서버 재부팅 후 gateway 안 뜸

SSH 세션을 끊으면 user 프로세스가 같이 죽을 수 있습니다.

```bash
loginctl enable-linger $USER
systemctl --user enable hermes-gateway
systemctl --user start hermes-gateway
```

## 로그에서 자주 보는 패턴

| 로그 키워드 | 의미 | 조치 |
| --- | --- | --- |
| `401 Unauthorized` | 토큰/API 키 | env 재설정 |
| `Conflict: terminated by other getUpdates` | 봇 이중 실행 | 중복 프로세스 kill |
| `Connection refused` | 네트워크·프록시 | 방화벽, outbound 확인 |
| `panic` / `crash loop` | 설정 파일 손상 | `hermes doctor --fix` |

## 연결 테스트 순서

1. `hermes chat -q "say ok"` — provider·모델 OK
2. `hermes gateway status` — connected
3. Telegram에서 `/start` 또는 설정된 명령 전송
4. `gateway.log`에 inbound 메시지 기록 확인
5. 응답 없으면 agent run 로그까지 추적

## 마무리

Telegram 무응답은 대부분 **토큰·프로세스·env 경로** 세 가지입니다. CLI가 된다는 건 provider까지는 살아 있다는 뜻이니, gateway 레이어만 좁혀 가면 됩니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Hermes Troubleshooting](https://hermes-tutorials.dev/blog/troubleshooting/)
- [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)
