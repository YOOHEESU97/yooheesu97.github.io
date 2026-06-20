---
title: 'Cursor Cloud Agent API란?'
description: 'Cursor 에이전트를 HTTP API로 호출해 GitHub 저장소 작업을 자동화하는 방법'
pubDate: 2026-06-20
tags: ['cursor', 'api', 'automation']
---

Cursor Cloud Agent API는 **저장소에서 동작하는 코딩 에이전트를 프로그래밍 방식으로 실행**하는 REST API입니다.

## 핵심 개념

- **Agent**: 저장소와 설정이 묶인 지속형 리소스
- **Run**: 프롬프트 하나당 실행 단위
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

## 활용 예

- GitHub 이슈 생성 → API 호출 → PR 자동 생성
- CI 실패 시 자동 수정 시도
- Slack 봇에서 "이 버그 고쳐줘" → 에이전트 실행

> v1은 공개 베타입니다. API가 변경될 수 있으니 [공식 문서](https://cursor.com/ko/docs/cloud-agent/api/endpoints)를 참고하세요.
