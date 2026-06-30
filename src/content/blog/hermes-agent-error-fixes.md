---
title: 'Hermes Agent 오류 메시지별 해결법'
description: '자주 나오는 Hermes 에러와 그때 실행하면 되는 명령·설정을 표로 정리'
pubDate: 2026-06-30
category: hermes-agent
tags: ['hermes', 'troubleshooting', 'debug']
---

Hermes Agent는 에러 메시지가 레이어마다 비슷해 보여서, 처음엔 같은 걸 여러 번 고치게 되더라고요. 몇 주 쓰면서 **증상 → 원인 → 고치는 명령** 패턴이 보여서, 자주 본 것만 표로 묶어 뒀습니다. 순서는 위에서 아래로 시도하면 됩니다.

## 먼저 실행할 명령

어떤 오류든 일단 이 순서입니다.

```bash
hermes doctor --fix
hermes config path
hermes config env-path
hermes tools list
```

로그가 필요하면:

```bash
grep -i error ~/.hermes/logs/gateway.log | tail -20
```

## 오류별 빠른 참조

| 오류 / 증상 | 흔한 원인 | 이렇게 고치기 |
| --- | --- | --- |
| `hermes: command not found` | PATH 미반영 | `source ~/.zshrc` 후 `hermes doctor --fix` |
| `no inference provider configured` | provider 미설정 | `hermes model` → `hermes chat -q "say ok"` |
| `401` / `Invalid API key` | 키 오타·provider 불일치 | `hermes auth set <provider>` → `hermes doctor` |
| `model call failed` / quota | 잔액·모델 ID 오류 | 대시보드 쿼터 확인, `hermes model`로 모델 재선택 |
| tool not available | toolset 비활성·세션 캐시 | `hermes tools list` → 설정 후 `/reset` |
| Docker backend exit 127 | Docker 미실행·권한 | `docker ps` 확인, 데몬 기동 또는 local backend |
| gateway crash loop | 토큰·경로·권한 | `hermes gateway status`, `gateway.log` 확인 |
| Telegram 봇 무응답 | webhook·토큰·방화벽 | 토큰 재발급, gateway 재시작 |
| 설치 스크립트 timeout | GitHub 접근 차단 | mirror clone 또는 수동 `git clone` + `install.sh` |
| `hermes update` 실패 | 권한·네트워크 | `~/.hermes` 쓰기 권한, proxy 확인 |
| 메모리 급증 | 긴 세션·대용량 컨텍스트 | `/reset`, 세션 분리, cron 작업 쪼개기 |

## 1. command not found

```bash
source ~/.bashrc   # 또는 ~/.zshrc
export PATH="$HOME/.hermes/bin:$PATH"
hermes --version
```

영구 반영은 셸 rc 파일에 PATH 한 줄 추가 후 재로그인입니다.

## 2. no inference provider configured

```bash
hermes model
hermes doctor
hermes chat -q "say ok"
```

`hermes model`이 없다면 버전이 낮을 수 있습니다.

```bash
hermes upgrade
hermes --version
```

## 3. API 401 / model errors

```bash
hermes config env-path
cat "$(hermes config env-path)"   # 키가 실제로 있는지
hermes auth set anthropic         # provider에 맞게 변경
hermes doctor
```

gateway를 systemd로 돌리면 **서비스 유저의 env**도 확인합니다. CLI로 넣은 키와 gateway가 읽는 파일이 다르면 CLI만 되고 봇만 안 됩니다.

## 4. Tool 관련 오류

증상 예: "tool isn't available", 터미널·브라우저 도구 호출 실패.

```bash
hermes tools list
```

필요 toolset 활성화 후 **반드시** 세션 리셋:

```
/reset
```

MCP를 붙였다면 MCP 서버 로그도 같이 봅니다. Hermes만 재시작해도 MCP 쪽이 죽어 있으면 같은 증상이 납니다.

## 5. Docker / terminal backend

```bash
docker ps
docker run hello-world
```

Docker가 되는데 Hermes만 실패하면 backend 설정을 local로 잠깐 바꿔 원인 분리합니다. 컨테이너 배포 시 `~/.hermes` 볼륨이 빠지면 재시작마다 설정이 초기화된 것처럼 보입니다.

## 6. Gateway (Telegram, Discord 등)

```bash
hermes gateway status
systemctl --user status hermes-gateway   # user 서비스 쓸 때
tail -30 ~/.hermes/logs/gateway.log
```

| 증상 | 확인 |
| --- | --- |
| 바로 죽음 | 로그의 panic/stack trace |
| 연결됐는데 무응답 | 봇 토큰, 채팅방 ID, 프라이버시 모드 |
| 재부팅 후 안 됨 | user lingering, systemd enable 여부 |

소스 clone 디렉터리가 아니라 **설치된 환경**에서 gateway를 띄웁니다.

## 7. 설치·업데이트 실패

네트워크 제한 환경:

```bash
git clone https://github.com/NousResearch/hermes-agent.git
cd hermes-agent
bash scripts/install.sh
```

Python 충돌이 의심되면 Hermes가 쓰는 `uv` 환경이 깨지지 않았는지 `hermes doctor`로 확인합니다.

## 디버깅 순서 (추천)

1. **Install** — `hermes --version`
2. **Config** — `hermes config path`, `env-path`
3. **Model** — `hermes model`, `hermes doctor`
4. **Smoke test** — `hermes chat -q "..."`
5. **Tools** — `hermes tools list`, `/reset`
6. **Gateway** — `hermes gateway status`, log

한 번에 두 레이어 이상 바꾸지 않는 게 제일 중요했습니다. provider 바꾸면서 gateway도 같이 붙이면, 뭐가 고쳐진 건지 감이 안 와요.

## 마무리

Hermes 오류는 대부분 **PATH → provider → 세션 리셋 → gateway 로그** 안에서 해결됐습니다. 위 표에서 내 메시지와 가장 가까운 행부터 따라가 보시면 됩니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Hermes Agent Troubleshooting](https://hermes-tutorials.dev/blog/troubleshooting/)
- [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)
