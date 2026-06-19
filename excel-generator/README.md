# Java 엑셀 생성기 (DRM 없는 일반 xlsx)

CMD에서 Java만으로 `.xlsx` 파일을 만드는 최소 예제입니다.

## 필요한 것

- Java 17 이상 (`java -version`)
- Maven (`mvn -version`) — 최초 1회 빌드용

## 사용법 (Windows CMD)

```cmd
cd excel-generator
build.cmd
run.cmd D:\work\거래내역.xlsx
```

빌드 후에는 아래처럼 직접 실행해도 됩니다.

```cmd
java -jar target\excel-generator.jar D:\work\거래내역.xlsx
```

## Linux / Mac

```bash
cd excel-generator
mvn -q clean package
java -jar target/excel-generator.jar ./output/거래내역.xlsx
```

## 코드 수정

- 데이터는 `src/main/java/ExcelGenerator.java` 의 `rows` 리스트를 바꾸면 됩니다.
- DB/API에서 읽어오도록 바꿀 때도 이 파일의 `createExcel` 메서드를 수정하면 됩니다.

## 참고

- 이 도구는 **일반 xlsx 파일**을 만듭니다.
- 은행 다운로드에 붙는 DRM과는 무관합니다.
- 회사 PC에 문서보안 에이전트가 있으면 저장 후 자동 암호화될 수 있습니다.
