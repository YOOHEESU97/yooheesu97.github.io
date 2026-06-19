@echo off
setlocal

cd /d "%~dp0"

where mvn >nul 2>&1
if errorlevel 1 (
    echo Maven이 설치되어 있지 않습니다.
    echo https://maven.apache.org/download.cgi 에서 설치 후 PATH에 추가하세요.
    exit /b 1
)

call mvn -q clean package
if errorlevel 1 (
    echo 빌드 실패
    exit /b 1
)

echo.
echo 빌드 완료: target\excel-generator.jar
echo 실행 예시: run.cmd D:\work\거래내역.xlsx
