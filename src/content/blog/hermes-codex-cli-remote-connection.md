---
title: '원격 서버의 Hermes Agent에 Codex CLI 연결하며 막혔던 곳'
description: 'OAuth 콜백과 SSH 포트 포워딩, Hermes·Codex의 별도 인증, 연결 후 달라진 작업 흐름 정리'
pubDate: 2026-10-11
publishedAt: 2026-10-11T23:25:54+09:00
category: hermes-agent
tags: ['hermes', 'codex-cli', 'ssh', 'oauth']
---

어제 원격 서버에서 돌아가는 Hermes Agent에 Codex CLI를 연결했습니다. 인증 화면에서 한 번, 모델을 바꾸는 과정에서 또 한 번 막혔어요. 연결하고 나니 서버에 있는 코드 작업을 Hermes 대화에서 이어가는 흐름이 왜 편한지도 조금 감이 왔습니다. 비슷하게 원격 서버에 설치할 분을 위해 제가 헷갈렸던 순서대로 적어 둡니다. 서버 주소와 인증 정보는 예시에서 제외했습니다.

## 먼저 구분해야 했던 두 가지 연결

처음에는 `hermes auth add openai-codex`만 끝내면 Codex CLI까지 전부 붙은 줄 알았습니다. 하지만 Hermes의 인증과 Codex CLI의 인증은 **별도의 저장소**를 씁니다. Hermes에서 Codex를 대화 모델로 고르는 것과, Codex CLI의 `app-server`를 실행 환경으로 쓰는 것도 다른 설정입니다.

제가 이해한 연결 순서는 이렇습니다.

1. 서버에 Codex CLI를 설치하고 `codex --version`으로 실행 여부 확인
2. Codex CLI에서 `codex login`으로 로그인
3. Hermes에서 `hermes auth add openai-codex`로 인증하고 `hermes model`에서 사용할 모델 선택
4. Codex의 터미널·파일 수정 실행 환경까지 쓰고 싶다면 **Hermes 대화 안에서** `/codex-runtime codex_app_server` 선택
5. 새 Hermes 세션을 열어 모델과 런타임 상태 확인

4번은 선택 사항입니다. Hermes에서 OpenAI Codex 모델로 대화하는 것과 Codex `app-server` 런타임을 켜는 것은 같은 일이 아닙니다. 현재 Hermes 문서도 런타임 변경이 **다음 세션부터** 적용된다고 안내합니다.

## 막힌 곳 1: `127.0.0.1:1455` 연결 거부

서버에서 `codex login`을 실행하고 출력된 주소를 제 노트북 브라우저에서 열었습니다. 로그인 후 `http://127.0.0.1:1455/auth/callback`으로 돌아왔는데, 브라우저에는 연결 거부가 떴어요. 여기서 `127.0.0.1`은 **브라우저를 연 노트북 자신**을 뜻합니다. 로그인 요청을 기다리는 Codex는 원격 서버에 있으니, 두 컴퓨터의 localhost가 달랐던 거죠.

현재 [OpenAI 공식 인증 안내](https://learn.chatgpt.com/docs/auth)는 원격·헤드리스 환경에서 가능하면 `codex login --device-auth`를 먼저 쓰고, 브라우저 콜백 방식이 필요하면 SSH 포트 포워딩을 사용하라고 설명합니다. 어제 겪은 문제는 후자의 방식에 해당했습니다.

```bash
# 내 컴퓨터의 터미널에서 실행하고, 로그인 완료까지 연결을 유지
ssh -i /path/to/ssh-key -L 1455:localhost:1455 user@remote-host

# 그 SSH 세션의 원격 서버에서 실행
codex login
```

로그인 주소는 `codex login`이 출력한 **전체 주소**를 로컬 브라우저에서 열어야 합니다. 콜백 URL을 직접 만들거나 일부만 복사할 필요는 없습니다. 로그인할 때만 필요한 터널이므로, 인증을 마친 뒤에는 이 포트 포워딩을 계속 열어 둘 필요가 없습니다.

## 막힌 곳 2: SSH 명령의 역슬래시 위치

처음에는 긴 SSH 명령을 한 줄에 넣으면서 `\ -L`처럼 역슬래시 뒤에 공백을 뒀습니다. 그 결과 `hostname contains invalid characters` 오류가 났어요. 셸에서 줄바꿈용 `\`는 **그 줄의 맨 마지막 문자**여야 합니다.

```bash
ssh -i /path/to/ssh-key \
  -L 1455:localhost:1455 \
  user@remote-host
```

헷갈리면 한 줄로 실행하는 편이 낫습니다.

```bash
ssh -i /path/to/ssh-key -L 1455:localhost:1455 user@remote-host
```

예시에 넣은 호스트와 키 경로는 자신의 환경에 맞게 바꾸면 됩니다. SSH 터널이 켜져 있는지 확인한 다음 `codex login`을 다시 시작해야, 새 로그인 시도가 콜백을 받을 수 있습니다.

## 막힌 곳 3: 인증은 됐는데 메인 모델은 그대로

`hermes auth add openai-codex`는 계정을 연결하는 단계입니다. 사용 모델은 서버 셸에서 `hermes model`로 따로 선택했습니다. `/codex-runtime codex_app_server`는 일반 셸 명령이 아니라 **Hermes 대화창의 슬래시 명령**입니다. 셸에서 그대로 실행하면 에러가 납니다.

```text
# 서버 셸
hermes model
hermes

# Hermes 대화창
/model
/codex-runtime
/codex-runtime codex_app_server
```

런타임을 바꾼 뒤에는 새 세션에서 다시 확인합니다. 서버 서비스로 Hermes를 띄우는 경우에는 대화형 셸과 `PATH`가 다를 수 있습니다. `command -v codex`가 가리키는 실행 파일을 서비스에서도 찾을 수 있는지 확인하세요. Hermes 공식 문서는 필요할 때 `model.codex_bin`에 Codex 실행 파일의 **절대 경로**를 지정하도록 안내합니다.

## 연결하고 나니 편했던 점

저에게 가장 큰 변화는 **원격 서버에 접속해 있는 대화에서 코드 작업을 이어갈 수 있다는 점**이었습니다. `codex_app_server` 런타임을 켜면 Hermes가 Codex CLI의 실행 환경을 통해 터미널 명령과 파일 수정을 다룰 수 있습니다. Codex에 설정한 MCP 서버나 설치된 플러그인을 Hermes 쪽으로 옮기는 경로도 제공됩니다. 실제로 어떤 기능이 보이는지는 설치 버전과 설정에 따라 확인해야 합니다.

서버의 Hermes gateway를 메신저와 연결해 두었다면, 노트북을 꺼도 **서버와 gateway가 계속 실행 중인 동안** 대화를 이어갈 수 있습니다. 이것은 Codex CLI만 설치해서 얻는 기능이 아니라 원격 서버에 Hermes gateway를 운영하는 구성에서 오는 장점입니다. Codex 로그인 때 쓴 SSH 터널과 평소 메신저 통신 경로도 별개예요.

한편 이 런타임은 Hermes 문서에서 선택 기능으로 안내하며, 일부 Hermes 고유 도구는 사용할 수 없다고 명시합니다. 계정 사용량에도 영향을 주므로, 연결했다고 사용량이 무제한이 되는 것은 아닙니다. 저는 `/model`과 `/codex-runtime`으로 현재 상태를 확인하고, 간단한 파일 읽기·수정 작업을 시켜 실제 경로가 원하는 대로 동작하는지 보는 편이 좋다고 생각합니다.

돌아보면 문제는 한 군데가 아니었습니다. **원격 인증의 localhost, Hermes와 Codex의 별도 인증, 모델 선택, 실행 런타임**을 각각 확인하니 어디서 막혔는지 구분할 수 있었어요. 처음부터 이 네 층을 나눠 봤다면 훨씬 덜 헤맸을 것 같습니다.

## 참고

- [OpenAI Docs: Codex 인증과 원격 로그인](https://learn.chatgpt.com/docs/auth)
- [Hermes Agent: Codex App-Server Runtime](https://github.com/NousResearch/hermes-agent/blob/main/website/docs/user-guide/features/codex-app-server-runtime.md)
- [Hermes Agent: 모델과 provider 설정](https://hermes-agent.nousresearch.com/docs/integrations/providers)
