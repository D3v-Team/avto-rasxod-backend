import * as ExcelJS from 'exceljs';

const CYRILLIC_MONTHS: Record<number, string> = {
  1: 'Январь',
  2: 'Феврал',
  3: 'Март',
  4: 'Апрель',
  5: 'Май',
  6: 'Июнь',
  7: 'Июль',
  8: 'Август',
  9: 'Сентябр',
  10: 'Октябр',
  11: 'Ноябр',
  12: 'Декабр',
};

export async function generateOrganizationReportWorkbook(
  reportData: any,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Хисобот');

  const year = reportData.year;
  const month = reportData.month;
  const monthName = CYRILLIC_MONTHS[month] || `${month}-ой`;

  // Dynamic fuels present in data
  const fuelMap = new Map<string, { id: string; name: string; unit: string }>();
  if (Array.isArray(reportData.data)) {
    reportData.data.forEach((carItem: any) => {
      if (Array.isArray(carItem.fuels)) {
        carItem.fuels.forEach((f: any) => {
          if (!fuelMap.has(f.fuel_id)) {
            fuelMap.set(f.fuel_id, {
              id: f.fuel_id,
              name: f.fuel_name,
              unit: f.fuel_unit,
            });
          }
        });
      }
    });
  }
  const fuels = Array.from(fuelMap.values());

  // Total columns count: 3 (№, Mas'ullar, Km) + fuels.length * 4 + 1 (Total Sum) + 3 (Holiday)
  const totalCols = 3 + fuels.length * 4 + 1 + 3;

  // Title Row (Row 1)
  worksheet.mergeCells(1, 1, 1, Math.max(totalCols, 7));
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `ЎКУФ Сирдарё вилоят кенгаши балансидаги автотранспорт воситалари томонидан ${year} йил ${monthName} ойида сарфланган ёқилғи харажатлари бўйича Хисобот`;
  titleCell.font = { name: 'Arial', size: 12, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.getRow(1).height = 35;

  // Header Rows (Row 2 & Row 3)
  worksheet.mergeCells(2, 1, 3, 1);
  worksheet.getCell(2, 1).value = '№';

  worksheet.mergeCells(2, 2, 3, 2);
  worksheet.getCell(2, 2).value = 'Бириктирилган масъуллар';

  worksheet.mergeCells(2, 3, 3, 3);
  worksheet.getCell(2, 3).value = 'Юрилган масофа км';

  let currentColIndex = 4;

  // Dynamic Fuel Headers
  fuels.forEach((fuel) => {
    const startCol = currentColIndex;
    const endCol = currentColIndex + 3;
    worksheet.mergeCells(2, startCol, 2, endCol);
    worksheet.getCell(2, startCol).value = `${fuel.name} (${fuel.unit})`;

    worksheet.getCell(3, startCol).value = 'Ой бошига қолдиқ';
    worksheet.getCell(3, startCol + 1).value = 'Ой давомида сарфланган';
    worksheet.getCell(3, startCol + 2).value = 'Суммаси';
    worksheet.getCell(3, startCol + 3).value = 'Ой охирига қолдиқ';

    currentColIndex += 4;
  });

  // Total sum Header
  const totalSumCol = currentColIndex;
  worksheet.mergeCells(2, totalSumCol, 3, totalSumCol);
  worksheet.getCell(2, totalSumCol).value = 'Умумий суммаси';
  currentColIndex += 1;

  // Holiday Headers
  const holidayStartCol = currentColIndex;
  worksheet.mergeCells(2, holidayStartCol, 2, holidayStartCol + 2);
  worksheet.getCell(2, holidayStartCol).value =
    'Дам олиш кунлари ва байрам саналарида';
  worksheet.getCell(3, holidayStartCol).value = 'км';
  worksheet.getCell(3, holidayStartCol + 1).value = 'миқдор';
  worksheet.getCell(3, holidayStartCol + 2).value = 'суммаси';

  // Style Header Rows
  [2, 3].forEach((rowNum) => {
    const row = worksheet.getRow(rowNum);
    row.height = 25;
    row.eachCell({ includeEmpty: false }, (cell) => {
      cell.font = { name: 'Arial', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6ECEF' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  });

  // Data Rows
  let currentRowIndex = 4;
  if (Array.isArray(reportData.data)) {
    reportData.data.forEach((carItem: any, index: number) => {
      const row = worksheet.getRow(currentRowIndex);
      row.height = 32;

      row.getCell(1).value = index + 1;

      const respName = carItem.car?.responsible_employee?.full_name || '—';
      const drvName = carItem.car?.driver?.full_name || '—';
      row.getCell(2).value = `Раис/Масъул: ${respName}\nХайдовчи: ${drvName}`;

      row.getCell(3).value = Number(carItem.total_mileage) || 0;

      let colIdx = 4;
      fuels.forEach((fuel) => {
        const carFuel = carItem.fuels?.find(
          (f: any) => f.fuel_id === fuel.id,
        );
        row.getCell(colIdx).value = carFuel
          ? Number(carFuel.start_balance) || 0
          : 0;
        row.getCell(colIdx + 1).value = carFuel
          ? Number(carFuel.consumed_amount) || 0
          : 0;
        row.getCell(colIdx + 2).value = carFuel
          ? Number(carFuel.consumed_sum) || 0
          : 0;
        row.getCell(colIdx + 3).value = carFuel
          ? Number(carFuel.end_balance) || 0
          : 0;
        colIdx += 4;
      });

      row.getCell(totalSumCol).value = Number(carItem.total_sum) || 0;
      row.getCell(holidayStartCol).value = Number(carItem.holiday?.km) || 0;
      row.getCell(holidayStartCol + 1).value =
        Number(carItem.holiday?.amount) || 0;
      row.getCell(holidayStartCol + 2).value =
        Number(carItem.holiday?.sum) || 0;

      // Formatting cells
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= totalCols) {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          if (colNumber === 2) {
            cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          } else if (colNumber === 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };
            cell.numFmt = '#,##0';
          }
        }
      });

      currentRowIndex++;
    });
  }

  // Grand Total Row
  const grandTotal = reportData.grand_total;
  if (grandTotal) {
    const summaryRow = worksheet.getRow(currentRowIndex);
    summaryRow.height = 30;

    summaryRow.getCell(1).value = '';
    summaryRow.getCell(2).value = 'Умумий жами';
    summaryRow.getCell(3).value = Number(grandTotal.total_mileage) || 0;

    let colIdx = 4;
    fuels.forEach((fuel) => {
      const gtFuel = grandTotal.fuels?.find((f: any) => f.fuel_id === fuel.id);
      summaryRow.getCell(colIdx).value = '—';
      summaryRow.getCell(colIdx + 1).value = gtFuel
        ? Number(gtFuel.total_consumed_amount) || 0
        : 0;
      summaryRow.getCell(colIdx + 2).value = gtFuel
        ? Number(gtFuel.total_consumed_sum) || 0
        : 0;
      summaryRow.getCell(colIdx + 3).value = '—';
      colIdx += 4;
    });

    summaryRow.getCell(totalSumCol).value = Number(grandTotal.total_sum) || 0;
    summaryRow.getCell(holidayStartCol).value =
      Number(grandTotal.holiday?.km) || 0;
    summaryRow.getCell(holidayStartCol + 1).value =
      Number(grandTotal.holiday?.amount) || 0;
    summaryRow.getCell(holidayStartCol + 2).value =
      Number(grandTotal.holiday?.sum) || 0;

    summaryRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= totalCols) {
        cell.font = { name: 'Arial', size: 10, bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD3D3D3' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (colNumber === 2) {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        } else if (colNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (cell.value !== '—') {
            cell.numFmt = '#,##0';
          }
        }
      }
    });
  }

  // Set Column Widths
  worksheet.getColumn(1).width = 6;
  worksheet.getColumn(2).width = 38;
  worksheet.getColumn(3).width = 18;

  for (let c = 4; c <= totalCols; c++) {
    worksheet.getColumn(c).width = 16;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
