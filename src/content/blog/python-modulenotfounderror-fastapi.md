---
title: 'Python ModuleNotFoundError: No module named fastapi — venv 해결'
description: '가상환경 미활성화, IDE 인터프리터, pip 설치 경로로 모듈 못 찾는 문제'
pubDate: 2026-07-02
category: python
tags: ['python', 'fastapi', 'venv']
---

FastAPI 프로젝트에서 흔히 보는 에러입니다.

```
ModuleNotFoundError: No module named 'fastapi'
```

코드는 맞는데 **실행 중인 Python이 패키지를 설치한 환경과 다를 때** 거의 항상 납니다.

## 원인

| 상황 | 설명 |
| --- | --- |
| venv 미활성화 | 시스템 Python으로 `uvicorn` 실행 |
| IDE 인터프리터 불일치 | VS Code가 다른 Python 선택 |
| Docker 이미지 | requirements 미설치 |
| 이름 충돌 | 로컬 `fastapi.py`가 패키지 가림 |

## 해결 1: venv 생성·활성화·설치

```bash
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -U pip
pip install fastapi uvicorn[standard]
```

프롬프트에 `(.venv)`가 보이는지 확인한 뒤 실행합니다.

```bash
which python
python -c "import fastapi; print(fastapi.__version__)"
```

## 해결 2: python -m으로 실행

```bash
python -m uvicorn app.main:app --reload
```

`uvicorn`만 치면 PATH에 있는 **다른 환경**의 바이너리가 실행될 수 있습니다.

## 해결 3: requirements 고정

```text
# requirements.txt
fastapi>=0.110.0
uvicorn[standard]>=0.27.0
pydantic>=2.0
```

```bash
pip install -r requirements.txt
```

CI/Docker도 같은 파일을 씁니다.

## 해결 4: VS Code / Cursor 인터프리터

Command Palette → **Python: Select Interpreter** → `.venv/bin/python` 선택.

터미널은 venv인데 IDE Run 버튼은 시스템 Python인 경우가 많습니다.

## 로컬 파일 이름 충돌

```
project/
  fastapi.py   # ❌ import fastapi 시 이 파일이 로드됨
  main.py
```

패키지 이름과 같은 파일명을 피하세요.

## Docker

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

컨테이너 안에서 `pip list | grep fastapi`로 확인합니다.

## 마무리

`ModuleNotFoundError`는 코드 문제라기보다 **환경 문제**인 경우가 대부분입니다. `which python` → `pip show fastapi` → 같은 셸에서 실행, 이 순서면 금방 끝납니다.

비슷한 고민을 하시는 분들께 도움이 되었으면 좋겠습니다.

## 참고

- [FastAPI — Installation](https://fastapi.tiangolo.com/#installation)
- [Python venv docs](https://docs.python.org/3/library/venv.html)
