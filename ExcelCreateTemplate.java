import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFFont;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.text.SimpleDateFormat;
import java.util.Calendar;

public class ExcelCreateTemplate {

    private static final int HEADER_ROW_INDEX = 8;
    private static final int DATA_START_ROW_INDEX = 9;

    // Windows 메모장/배치 txt는 보통 MS949. UTF-8로 저장했으면 "UTF-8"로 변경
    private static final Charset DATA_FILE_CHARSET = Charset.forName("MS949");

    public static void main(String[] args) {
        XSSFWorkbook workbook = new XSSFWorkbook();
        XSSFSheet sheet = workbook.createSheet("실적정보");

        FileOutputStream fos = null;
        BufferedReader br = null;

        try {
            XSSFFont titleFont = workbook.createFont();
            titleFont.setFontHeightInPoints((short) 12);
            titleFont.setBold(true);
            titleFont.setFontName("맑은 고딕");

            XSSFCellStyle titleStyle = workbook.createCellStyle();
            titleStyle.setFont(titleFont);

            XSSFCellStyle headerStyle = workbook.createCellStyle();
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            String[] guidelines = {
                    "KB마에스트로 금액(포인트리) 실적정보 엑셀 업로드 양식",
                    "1. 고객암호화번호가 누락되면 실적정보에서 조회되지 않습니다. 확인 후 입력해 주세요.",
                    "2. 기준년월은 해당 KB마에스트로 포인트리를 지급한 기준년월을 입력해 주세요.(YYYYMM으로 기재)",
                    "3. 교차수의 경우 숫자만 입력 가능합니다.(2VVIP일 경우 2만 기재)",
                    "4. B10행 부터 입력 가능합니다.",
                    "5. 엑셀 양식을 변경시 업로드 되지 않습니다."
            };

            for (int i = 0; i < guidelines.length; i++) {
                XSSFRow row = sheet.createRow(i);
                XSSFCell cell = row.createCell(0);
                cell.setCellValue(guidelines[i]);
                if (i == 0) {
                    cell.setCellStyle(titleStyle);
                }
            }

            String[] headers = {"기준년월", "고객암호화번호OW", "교차수", "KB마에스트로 금액"};
            for (int i = 0; i < headers.length; i++) {
                sheet.setColumnWidth(i, 6000);
            }

            XSSFRow headerRow = sheet.createRow(HEADER_ROW_INDEX);
            for (int i = 0; i < headers.length; i++) {
                XSSFCell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowNum = DATA_START_ROW_INDEX;
            String dataFilePath = "C:/excel_test/data.txt";
            File dataFile = new File(dataFilePath);

            if (dataFile.exists()) {
                br = new BufferedReader(new InputStreamReader(new FileInputStream(dataFile), DATA_FILE_CHARSET));
                String line;

                while ((line = br.readLine()) != null) {
                    line = removeBom(line);
                    if (line.trim().isEmpty()) {
                        continue;
                    }

                    String[] dataColumns = line.split(",", -1);
                    XSSFRow row = sheet.createRow(rowNum++);

                    for (int i = 0; i < headers.length; i++) {
                        XSSFCell cell = row.createCell(i);
                        if (i < dataColumns.length) {
                            cell.setCellValue(dataColumns[i].trim());
                        } else {
                            cell.setCellValue("");
                        }
                    }
                }
                System.out.println("외부 데이터 파일 읽기 성공!");
            } else {
                System.out.println("경고: 데이터 파일을 찾을 수 없습니다! 경로를 확인하세요: " + dataFilePath);
            }

            Calendar calendar = Calendar.getInstance();
            String uploadDate = new SimpleDateFormat("yyyyMMdd").format(calendar.getTime());
            String filename = "KB마에스트로금액실적정보_업로드양식_" + uploadDate + ".xlsx";

            String path = "C:/temp_excel/";
            File dir = new File(path);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            File file = new File(path + filename);
            fos = new FileOutputStream(file);
            workbook.write(fos);
            System.out.println("엑셀 파일 생성 완료: " + file.getAbsolutePath());

        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (br != null) {
                    br.close();
                }
                if (fos != null) {
                    fos.close();
                }
                if (workbook != null) {
                    workbook.close();
                }
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    private static String removeBom(String line) {
        if (line != null && !line.isEmpty() && line.charAt(0) == '\uFEFF') {
            return line.substring(1);
        }
        return line;
    }
}
