---
title: 'Cursor Cloud Agent API란?'
description: 'Cursor 에이전트를 HTTP API로 호출해 GitHub 저장소 작업을 자동화하는 방법'
pubDate: 2026-06-20
tags: ['cursor', 'api', 'automation']
---

Cursor 쓰다가 "이거 API로도 호출할 수 있지 않을까?" 해서 알아봤는데, **Cloud Agent API**가 있더라고요. 저장소에서 돌아가는 코딩 에이전트를 HTTP로 실행하고 관리할 수 있습니다. Hermes Agent랑 비슷해 보이지만, 성격은 꽤 다릅니다. 함께 정리해 볼게요.

## 핵심 개념

- **Agent**: 저장소와 설정이 묶인 지속형 리소스입니다.
- **Run**: 프롬프트 하나당 실행 단위예요.
- **Base URL**: `https://api.cursor.com`

## 대표 엔드포인트

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| POST | `/v1/agents` | 에이전트 생성 + 첫 실행 |
| POST | `/v1/agents/{id}/runs` | 추가 지시 (follow-up) |
| GET | `/v1/agents/{id}/runs/{runId}/stream` | 실행 스트리밍 |
| GET | `/v1/agents/{id}/artifacts` | 결과물 조회 |

## Hermes Agent와의 차이

| | Cursor Cloud Agent API | Hermes Agent |
| --- | --- | --- |
| 성격 | Cursor 호스팅 코딩 SaaS | 범용 오픈소스 에이전트 |
| 용도 | GitHub 저장소 코드 수정, PR | 터미널·파일·웹 등 범용 작업 |
| 실행 | Cursor 클라우드 VM | 로컬 / 자체 서버 |

한 줄로 말하면, Hermes는 **만능 에이전트 엔진**, Cursor API는 **GitHub 작업 자동화용 원격 코딩 워커**에 가깝습니다.

## 활용 예

- GitHub 이슈 생성 → API 호출 → PR 자동 생성
- CI 실패 시 자동 수정 시도
- Slack 봇에서 "이 버그 고쳐줘" → 에이전트 실행

이런 식으로 CI나 봇 파이프라인에 붙이면, IDE 앞에 앉아 있지 않아도 저장소 작업을 시킬 수 있어요.

> v1은 공개 베타입니다. API가 변경될 수 있으니 [공식 문서](https://cursor.com/ko/docs/cloud-agent/api/endpoints)를 참고하세요.

## 마무리

"에이전트를 프로그래밍으로 쓸 수 있나?"에 대한 답은 **예**입니다. 다만 범용 챗봇 API가 아니라 **저장소 작업 중심**이라는 점만 기억해 두시면 됩니다.
