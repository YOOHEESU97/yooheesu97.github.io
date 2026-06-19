import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class ExcelGenerator {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    public static void main(String[] args) {
        if (args.length == 0) {
            printUsage();
            System.exit(1);
        }

        Path outputPath = Paths.get(args[0]).toAbsolutePath().normalize();

        try {
            createExcel(outputPath);
            System.out.println("엑셀 생성 완료: " + outputPath);
        } catch (IOException e) {
            System.err.println("엑셀 생성 실패: " + e.getMessage());
            System.exit(1);
        }
    }

    private static void printUsage() {
        System.out.println("사용법: java -jar excel-generator.jar <저장경로.xlsx>");
        System.out.println("예시:  java -jar excel-generator.jar D:\\work\\거래내역.xlsx");
    }

    private static void createExcel(Path outputPath) throws IOException {
        Path parent = outputPath.getParent();
        if (parent != null) {
            Files.createDirectories(parent);
        }

        List<String[]> rows = List.of(
                new String[]{"거래일자", "적요", "입금", "출금", "잔액"},
                new String[]{LocalDate.now().minusDays(2).format(DATE_FORMAT), "급여", "3,000,000", "", "3,000,000"},
                new String[]{LocalDate.now().minusDays(1).format(DATE_FORMAT), "카드결제", "", "45,000", "2,955,000"},
                new String[]{LocalDate.now().format(DATE_FORMAT), "이체입금", "100,000", "", "3,055,000"}
        );

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("거래내역");

            for (int rowIndex = 0; rowIndex < rows.size(); rowIndex++) {
                Row row = sheet.createRow(rowIndex);
                String[] values = rows.get(rowIndex);

                for (int colIndex = 0; colIndex < values.length; colIndex++) {
                    Cell cell = row.createCell(colIndex);
                    cell.setCellValue(values[colIndex]);
                }
            }

            for (int colIndex = 0; colIndex < rows.get(0).length; colIndex++) {
                sheet.autoSizeColumn(colIndex);
            }

            try (OutputStream out = Files.newOutputStream(outputPath)) {
                workbook.write(out);
            }
        }
    }
}
