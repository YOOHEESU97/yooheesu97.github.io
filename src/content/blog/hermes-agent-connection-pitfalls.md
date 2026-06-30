---
title: 'Hermes Agent 처음 연결할 때 막혔던 것들'
description: '설치 직후 PATH, provider 설정, gateway 연결에서 겪은 시행착오 정리'
pubDate: 2026-06-30
category: hermes-agent
tags: ['hermes', 'setup', 'automation']
---

Hermes Agent를 처음 붙일 때는 문서만 보면 금방 될 것 같았는데, 실제로는 **설치 → provider 연결 → 도구 확인 → gateway(선택)** 순서에서 하나씩 걸리더라고요. Cursor Cloud Agent API랑 달리 로컬/서버에서 직접 돌리는 만큼, 환경 변수·PATH·세션 상태를 내가 챙겨야 합니다. 제가 연결하면서 막혔던 지점만 골라 적어 둡니다.

## 전체 연결 흐름

먼저 큰 그림을 잡아두면 디버깅이 쉽습니다.

```
설치 → hermes doctor → provider(API 키) → smoke test → tools 확인 → (선택) gateway
```

한 번에 gateway까지 붙이려다 보면 어디서 터졌는지 구분이 안 됩니다. 저는 **CLI에서 `hermes chat`이 한 번 성공할 때까지** gateway는 나중에 붙였어요.

## 1. `hermes: command not found`

설치 스크립트는 끝났는데 명령어가 안 먹는 경우가 제일 흔했습니다. 바이너리는 `~/.hermes/bin/`에 있는데, **현재 셸 세션 PATH에 반영이 안 된** 상태예요.

```bash
source ~/.bashrc   # zsh면 ~/.zshrc
hermes --version
```

그래도 안 되면:

```bash
export PATH="$HOME/.hermes/bin:$PATH"
hermes doctor --fix
```

`doctor --fix`가 PATH·의존성·설정 파일을 한 번에 점검해 줍니다. 공식 튜토리얼에서도 첫 단계로 권장하는 편이에요.

## 2. `no inference provider configured`

설치는 됐는데 채팅하면 provider가 없다고 나옵니다. 설치 마법사를 건너뛰었거나, `~/.hermes` 설정을 지운 뒤 재설치했을 때 자주 봤어요.

```bash
hermes model          # provider 선택 + API 키 입력
hermes doctor
hermes chat -q "say ok"
```

`hermes model` 한 번으로 provider·모델·키를 맞춘 다음, **짧은 smoke test**로 끝까지 도는지 확인합니다. gateway 붙이기 전에 이걸 통과시키는 게 중요해요.

키 위치가 헷갈리면:

```bash
hermes config path
hermes config env-path
```

예상한 프로필/`.env` 파일을 가리키는지 먼저 봅니다. gateway를 systemd로 다른 유저로 띄우면, **내가 설정한 키와 gateway가 읽는 키가 달라질** 수 있어요.

## 3. API 키는 넣었는데 401 / model call failure

wizard에서는 성공했는데 실제 호출에서 401이 나오면, 아래를 순서대로 봤습니다.

| 확인 항목 | 내용 |
| --- | --- |
| 키 앞뒤 공백 | 복붙 시 줄바꿈·스페이스 포함 여부 |
| provider 불일치 | Anthropic 키에 OpenAI provider 선택 등 |
| 잔액·쿼터 | 대시보드에서 사용 한도 확인 |
| 모델 이름 | provider별 허용 모델 ID 형식 |

키를 다시 넣을 때:

```bash
hermes auth set anthropic   # 사용 중인 provider에 맞게
hermes doctor
```

## 4. 도구(tool)가 문서에는 있는데 안 보일 때

Hermes는 도구를 **toolset** 단위로 묶습니다. 설정을 바꿔도 **현재 세션에는 반영이 안 되는** 경우가 많아요.

```bash
hermes tools list
```

목록에 없으면 해당 toolset을 켠 뒤, 세션을 새로 시작합니다.

```
/reset
```

또는 `hermes`를 종료했다가 다시 실행. "설정은 바꿨는데 여전히 없다"의 상당수가 이 케이스였습니다.

## 5. Docker terminal backend 붙일 때

터미널 도구를 Docker 샌드박스로 돌리면 `exit 127`·Docker startup error가 날 수 있습니다. 로컬에서 먼저 띄워 본 뒤:

```bash
docker ps
```

Docker 데몬이 안 떠 있으면 Hermes 쪽 터미널도 실패합니다. 빠르게 우회하려면 로컬 backend로 두고, 나중에 Docker를 붙이는 식이 덜 스트레스였어요.

컨테이너로 Hermes 자체를 돌릴 때는 `~/.hermes` 볼륨 마운트를 빼먹으면 **재시작 후 설정·스킬이 사라진 것처럼** 보입니다. compose에 홈 디렉터리 마운트가 있는지 확인하세요.

## 6. Telegram / Discord gateway 연결

CLI가 되는데 봇만 안 되면 gateway 레이어 문제입니다.

```bash
hermes gateway status
tail -20 ~/.hermes/logs/gateway.log
```

제가 겪은 패턴:

- **토큰 오타** — BotFather 토큰 앞뒤 공백
- **소스 폴더에서 gateway 실행** — 설치본 말고 clone 폴더에서 띄우면 경로 꼬임
- **로그아웃 후 gateway 종료** — 서버면 `loginctl enable-linger` 또는 user systemd 등록 필요

gateway는 CLI smoke test **이후**에 붙이는 걸 추천합니다. 두 레이어를 동시에 바꾸면 원인 분리가 어렵거든요.

## 7. Windows(네이티브)에서는 안 됨

2026년 기준 Hermes는 **Linux / macOS / WSL2**가 공식 지원입니다. PowerShell에서 바로 설치하려다 막히면 WSL2 Ubuntu 안에서 다시 하는 게 맞아요. 처음에 10~15분 더 걸리지만, 이후 PATH·gateway 이슈가 훨씬 적었습니다.

## 연결 체크리스트

- [ ] `hermes --version` 동작
- [ ] `hermes doctor --fix` 통과
- [ ] `hermes chat -q "say ok"` 성공
- [ ] `hermes tools list`에 필요한 toolset 표시
- [ ] (선택) `hermes gateway status` connected
- [ ] gateway 로그에 반복 crash 없음

## 마무리

Hermes 연결은 "한 방에 끝"보다 **레이어별로 증명**하는 게 빠릅니다. install → model → chat → tools → gateway 순으로 좁혀 가면, 문서에 없는 내 환경 이슈도 금방 잡히더라고요.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [Hermes Agent GitHub](https://github.com/NousResearch/hermes-agent)
- [Troubleshooting — Hermes Tutorials](https://hermes-tutorials.dev/blog/troubleshooting/)
