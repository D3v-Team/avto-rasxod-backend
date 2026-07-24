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

export async function generateCarMonthlyReportWorkbook(
  reportData: any,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Журнал');

  const {
    car,
    fuels = [],
    year,
    month,
    records = [],
    summaryByFuel = {},
  } = reportData;

  const monthName = CYRILLIC_MONTHS[month] || `${month}-ой`;
  const daysInMonth = new Date(year, month, 0).getDate();

  // Total columns = 4 static (Date, Odo start, Odo end, Mileage) + fuels.length * 3 (Received, Expense, Balance) + 1 (Purchase sum)
  const totalCols = 4 + fuels.length * 3 + 1;
  const purchaseSumCol = 4 + fuels.length * 3 + 1;

  // Title Row (Row 1)
  worksheet.mergeCells(1, 1, 1, Math.max(totalCols, 7));
  const titleCell = worksheet.getCell(1, 1);
  const fuelNamesStr = fuels.map((f: any) => f.name).join(', ');
  titleCell.value = `Расход ${fuelNamesStr} на автомобиль ${car?.name || ''} ${car?.plate_number || ''} согласно путевым листам за ${monthName} ${year} года`;
  titleCell.font = { name: 'Arial', size: 12, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.getRow(1).height = 32;

  // Header Row 2 & Row 3
  worksheet.mergeCells(2, 1, 3, 1);
  worksheet.getCell(2, 1).value = 'Дата';

  worksheet.mergeCells(2, 2, 3, 2);
  worksheet.getCell(2, 2).value = 'Спидометр (нач. дня)';

  worksheet.mergeCells(2, 3, 3, 3);
  worksheet.getCell(2, 3).value = 'Спидометр (конец дня)';

  worksheet.mergeCells(2, 4, 3, 4);
  worksheet.getCell(2, 4).value = 'Пробег за день (км)';

  let currentCol = 5;
  fuels.forEach((fuel: any) => {
    const startCol = currentCol;
    const endCol = currentCol + 2;
    worksheet.mergeCells(2, startCol, 2, endCol);
    worksheet.getCell(2, startCol).value = `${fuel.name} (${fuel.unit})`;

    worksheet.getCell(3, startCol).value = 'Получено';
    worksheet.getCell(3, startCol + 1).value = 'Расход';
    worksheet.getCell(3, startCol + 2).value = 'Остаток';

    currentCol += 3;
  });

  worksheet.mergeCells(2, purchaseSumCol, 3, purchaseSumCol);
  worksheet.getCell(2, purchaseSumCol).value = 'Сумма покупки (сум)';

  // Style Headers
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

  // Track running balance per fuel
  const runningBalances: Record<string, number> = {};
  fuels.forEach((f: any) => {
    const s = summaryByFuel[f.id];
    runningBalances[f.id] = s?.start_balance !== undefined ? Number(s.start_balance) : 0;
  });

  const totalsByFuel: Record<string, { received: number; expence: number }> = {};
  fuels.forEach((f: any) => {
    totalsByFuel[f.id] = { received: 0, expence: 0 };
  });
  let grandTotalMileage = 0;
  let grandTotalPurchaseSum = 0;

  let currentRowIndex = 4;
  const days = reportData.days || [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const displayDate = `${dayStr}.${monthStr}.${year}`;
    const fullDate = `${year}-${monthStr}-${dayStr}`;

    const dayData = days.find((d: any) => d.date === fullDate);
    const dayRecords = dayData ? dayData.expenses : [];
    const isHoliday = dayRecords.some((r: any) => r.is_holiday);

    const row = worksheet.getRow(currentRowIndex);
    row.height = 22;

    row.getCell(1).value = displayDate;

    // Odometer start / end / mileage for day
    if (dayData && dayData.odometer_start !== null && dayData.odometer_end !== null) {
      row.getCell(2).value = Number(dayData.odometer_start) || 0;
      row.getCell(3).value = Number(dayData.odometer_end) || 0;
      row.getCell(4).value = Number(dayData.mileage) || 0;
      
      // FAQAT yozuv bo'lgan kunlardagi mileni qo'shamiz (grandTotal ikki marta qo'shilmasligi uchun, garchi bo'sh kunlarda 0 bo'lsa ham)
      if (dayRecords.length > 0) {
        grandTotalMileage += Number(dayData.mileage) || 0;
      }
    } else {
      row.getCell(2).value = '';
      row.getCell(3).value = '';
      row.getCell(4).value = 0;
    }

    let dayPurchaseSum = 0;
    let colIdx = 5;

    fuels.forEach((fuel: any) => {
      const recForFuel = dayRecords.find((r) => r.fuel_id === fuel.id);

      if (recForFuel) {
        const rReceived = Number(recForFuel.received_amount) || 0;
        const rExpence = Number(recForFuel.fuel_expence) || 0;
        const rBalance = Number(recForFuel.balance_after) || 0;
        const rPrice = Number(recForFuel.fuel_price_at_time) || fuel.price || 0;

        runningBalances[fuel.id] = rBalance;
        totalsByFuel[fuel.id].received += rReceived;
        totalsByFuel[fuel.id].expence += rExpence;
        dayPurchaseSum += rReceived * rPrice;

        row.getCell(colIdx).value = rReceived > 0 ? rReceived : '';
        row.getCell(colIdx + 1).value = rExpence;
        row.getCell(colIdx + 2).value = rBalance;
      } else {
        row.getCell(colIdx).value = '';
        row.getCell(colIdx + 1).value = 0;
        row.getCell(colIdx + 2).value = runningBalances[fuel.id];
      }

      colIdx += 3;
    });

    row.getCell(purchaseSumCol).value = dayPurchaseSum > 0 ? dayPurchaseSum : '';
    grandTotalPurchaseSum += dayPurchaseSum;

    // Formatting
    row.eachCell({ includeEmpty: true }, (cell, cIdx) => {
      if (cIdx <= totalCols) {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (isHoliday) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF5F5F5' },
          };
        }
        if (cIdx === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0';
          }
        }
      }
    });

    currentRowIndex++;
  }

  // Summary Row (Итого)
  const summaryRow = worksheet.getRow(currentRowIndex);
  summaryRow.height = 26;

  summaryRow.getCell(1).value = 'Итого';
  summaryRow.getCell(2).value = '';
  summaryRow.getCell(3).value = '';
  summaryRow.getCell(4).value = grandTotalMileage;

  let colIdx = 5;
  fuels.forEach((fuel: any) => {
    summaryRow.getCell(colIdx).value = totalsByFuel[fuel.id].received;
    summaryRow.getCell(colIdx + 1).value = totalsByFuel[fuel.id].expence;
    summaryRow.getCell(colIdx + 2).value = '—';
    colIdx += 3;
  });

  summaryRow.getCell(purchaseSumCol).value = grandTotalPurchaseSum;

  summaryRow.eachCell({ includeEmpty: true }, (cell, cIdx) => {
    if (cIdx <= totalCols) {
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
      if (cIdx === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (typeof cell.value === 'number') {
          cell.numFmt = '#,##0';
        }
      }
    }
  });

  currentRowIndex += 2;

  // Sal'do Block per fuel
  fuels.forEach((fuel: any) => {
    const s = summaryByFuel[fuel.id] || {};

    const saldoItems = [
      { label: `Сальдо на начало месяца (${fuel.name}):`, val: s.start_balance ?? 0 },
      { label: `Получено за месяц (${fuel.name}):`, val: s.total_received ?? totalsByFuel[fuel.id].received },
      { label: `Расход за месяц (${fuel.name}):`, val: s.total_expence ?? totalsByFuel[fuel.id].expence },
      { label: `Сальдо на конец месяца (${fuel.name}):`, val: s.end_balance ?? runningBalances[fuel.id] },
      { label: `Стоимость топлива за месяц (${fuel.name}):`, val: s.total_received_price ?? 0 }, // ✅ Fuel.price o'rniga saqlangan narx summasi ishlatiladi
    ];

    saldoItems.forEach((item) => {
      const r = worksheet.getRow(currentRowIndex);
      r.height = 20;

      worksheet.mergeCells(currentRowIndex, 1, currentRowIndex, 3);
      const lblCell = r.getCell(1);
      lblCell.value = item.label;
      lblCell.font = { name: 'Arial', size: 10, bold: true };
      lblCell.alignment = { vertical: 'middle', horizontal: 'left' };

      const valCell = r.getCell(4);
      valCell.value = Number(item.val) || 0;
      valCell.font = { name: 'Arial', size: 10, bold: true };
      valCell.alignment = { vertical: 'middle', horizontal: 'right' };
      valCell.numFmt = '#,##0';

      [1, 2, 3, 4].forEach((c) => {
        r.getCell(c).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      currentRowIndex++;
    });

    currentRowIndex++;
  });

  // Set Column Widths
  worksheet.getColumn(1).width = 14;
  worksheet.getColumn(2).width = 20;
  worksheet.getColumn(3).width = 20;
  worksheet.getColumn(4).width = 18;

  for (let c = 5; c <= totalCols; c++) {
    worksheet.getColumn(c).width = 16;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
