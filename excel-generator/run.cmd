@echo off
setlocal

cd /d "%~dp0"

if not exist "target\excel-generator.jar" (
    echo JAR 파일이 없습니다. 먼저 build.cmd 를 실행하세요.
    exit /b 1
)

if "%~1"=="" (
    echo 사용법: run.cmd ^<저장경로.xlsx^>
    echo 예시:  run.cmd D:\work\거래내역.xlsx
    exit /b 1
)

java -jar target\excel-generator.jar "%~1"
