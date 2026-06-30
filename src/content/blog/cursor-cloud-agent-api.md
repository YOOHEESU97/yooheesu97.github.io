---
title: 'Cursor Cloud Agent API란?'
description: 'Cursor 에이전트를 HTTP API로 호출해 GitHub 저장소 작업을 자동화하는 방법'
pubDate: 2026-06-20
updatedDate: 2026-06-30
category: hermes-agent
tags: ['cursor', 'api', 'automation', 'hermes']
---

Cursor 쓰다가 "이거 API로도 호출할 수 있지 않을까?" 해서 알아봤는데, **Cloud Agent API**가 있더라고요. 저장소에서 돌아가는 코딩 에이전트를 HTTP로 실행하고 관리할 수 있습니다. Hermes Agent랑 비슷해 보이지만, 성격은 꽤 다릅니다. 함께 정리해 볼게요.

## 핵심 개념

- **Agent**: 저장소와 설정이 묶인 지속형 리소스입니다. 브랜치, 모델, 권한이 연결돼요.
- **Run**: 프롬프트 하나당 실행 단위예요. follow-up으로 이어서 지시할 수 있습니다.
- **Artifact**: diff, 로그, 생성 파일 등 실행 결과물입니다.
- **Base URL**: `https://api.cursor.com`

흐름은 대략 이렇습니다.

```
이슈/웹훅 → POST /v1/agents → Run 실행 → 스트림/아티팩트 조회 → PR 생성
```

## 대표 엔드포인트

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| POST | `/v1/agents` | 에이전트 생성 + 첫 실행 |
| POST | `/v1/agents/{id}/runs` | 추가 지시 (follow-up) |
| GET | `/v1/agents/{id}/runs/{runId}/stream` | 실행 스트리밍 |
| GET | `/v1/agents/{id}/artifacts` | 결과물 조회 |

## 인증

API 키는 Cursor 대시보드에서 발급합니다. 요청 헤더에 Bearer 토큰을 넣습니다.

```bash
curl -X POST "https://api.cursor.com/v1/agents" \
  -H "Authorization: Bearer $CURSOR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "README 스택 섹션에 MDX 항목을 추가하고 커밋해 주세요.",
    "source": {
      "repository": "https://github.com/YOOHEESU97/yooheesu97.github.io",
      "ref": "main"
    }
  }'
```

실제 필드명·스키마는 베타 중에 바뀔 수 있으니, 호출 전 [공식 문서](https://cursor.com/ko/docs/cloud-agent/api/endpoints)를 한 번 더 확인하는 게 안전합니다.

## Hermes Agent와의 차이

| | Cursor Cloud Agent API | Hermes Agent |
| --- | --- | --- |
| 성격 | Cursor 호스팅 코딩 SaaS | 범용 오픈소스 에이전트 |
| 용도 | GitHub 저장소 코드 수정, PR | 터미널·파일·웹 등 범용 작업 |
| 실행 환경 | Cursor 클라우드 VM | 로컬 / 자체 서버 |
| 연동 | GitHub 중심 | 셸·MCP·커스텀 도구 |
| 적합한 작업 | 이슈→PR 자동화 | 서버 운영, 복합 워크플로 |

한 줄로 말하면, Hermes는 **만능 에이전트 엔진**, Cursor API는 **GitHub 작업 자동화용 원격 코딩 워커**에 가깝습니다.

## Hermes Agent는 언제 쓰나

Hermes는 로컬 머신이나 사내 서버에서 **도구를 직접 붙여** 쓰고 싶을 때 유리합니다. 예를 들면:

- 배포 스크립트 실행 후 헬스체크
- 사내 Wiki·Jira·Slack을 오가는 커스텀 파이프라인
- MCP 서버로 사내 DB 읽기 (권한 통제 전제)

반면 "GitHub 저장소에 브랜치 따서 PR 올려줘"만 반복한다면 Cursor Cloud Agent API가 설정이 단순한 편이었어요.

## 활용 예

### 1) GitHub 이슈 → PR

이슈가 `bug` 라벨로 열리면 웹훅이 API를 호출하고, 에이전트가 재현·수정·PR까지 시도합니다.

### 2) CI 실패 자동 대응

워크플로 실패 시 로그 일부를 프롬프트에 넣어 follow-up run을 돌립니다. 완전 자동 머지는 위험하니, 초안 PR까지만 두는 팀이 많습니다.

### 3) Slack 봇

`/fix lint` 같은 슬래시 커맨드 → API 호출 → 완료 시 스레드에 PR 링크 회신.

## 운영 시 체크리스트

- [ ] API 키는 GitHub Actions secret / Vault에만 보관
- [ ] 에이전트 브랜치 네이밍 규칙 (`cursor/...`) 통일
- [ ] 프로덕션 브랜치 직접 push 금지, PR 리뷰 필수
- [ ] 프롬프트에 **완료 조건**과 **변경 금지 영역** 명시
- [ ] run 실패 시 재시도 상한·알림 채널 설정

## 주의할 점

- v1은 **공개 베타**입니다. 엔드포인트·응답 형식이 변경될 수 있어요.
- 에이전트가 생성한 diff는 **반드시 사람이 리뷰**하는 전제가 안전합니다.
- 민감한 저장소는 읽기 전용 토큰·브랜치 보호 규칙을 먼저 점검합니다.

## 마무리

"에이전트를 프로그래밍으로 쓸 수 있나?"에 대한 답은 **예**입니다. 다만 범용 챗봇 API가 아니라 **저장소 작업 중심**이라는 점만 기억해 두시면 됩니다. Hermes로 범용 자동화를, Cursor API로 GitHub 코딩 워크플로를 나누는 식으로 쓰면 역할이 잘 맞더라고요.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.
