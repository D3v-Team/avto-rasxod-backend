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

const FONT_NAME = 'Arial';
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE6ECEF' },
};
const HOLIDAY_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF5F5F5' },
};
const TOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD3D3D3' },
};
const GRAND_TOTAL_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFB8CCE4' },
};
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

const COL_DATE = 1;
const COL_FUEL_NAME = 2;
const COL_ODO_START = 3;
const COL_ODO_END = 4;
const COL_MILEAGE = 5;
const COL_RECEIVED = 6;
const COL_EXPENCE = 7;
const COL_BALANCE = 8;
const COL_PURCHASE_SUM = 9;
const TOTAL_COLS = 9;

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
    days = [],
    summaryByFuel = {},
    totals = [],
    holiday_totals = [],
  } = reportData;

  const monthName = CYRILLIC_MONTHS[month] || `${month}-ой`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const fuelNamesStr = fuels.map((f: any) => f.name).join(', ');

  worksheet.mergeCells(1, 1, 1, TOTAL_COLS);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `Расход ${fuelNamesStr} на автомобиль ${car?.name || ''} ${car?.plate_number || ''} согласно путевым листам за ${monthName} ${year} года`;
  titleCell.font = { name: FONT_NAME, size: 10, bold: true };
  titleCell.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  };
  worksheet.getRow(1).height = 26;

  const headerLabels = [
    'Дата',
    'Ёқилғи',
    'Спидометр\n(нач.)',
    'Спидометр\n(кон.)',
    'Пробег\n(км)',
    'Олинган',
    'Расход',
    'Қолдиқ',
    'Сумма\nпокупки (сум)',
  ];
  const headerRow = worksheet.getRow(2);
  headerLabels.forEach((label, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = label;
    cell.font = { name: FONT_NAME, size: 8, bold: true };
    cell.alignment = {
      horizontal: 'center',
      vertical: 'middle',
      wrapText: true,
    };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
  });
  headerRow.height = 26;

  let currentRowIndex = 3;
  let grandTotalMileage = 0;
  let grandTotalPurchaseSum = 0;
  let holidayTotalMileage = 0;
  let holidayTotalPurchaseSum = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const displayDate = `${dayStr}.${monthStr}.${year}`;
    const fullDate = `${year}-${monthStr}-${dayStr}`;

    const dayData = days.find((d: any) => d.date === fullDate);
    const dayRecords: any[] = dayData ? dayData.expenses : [];
    const isHoliday = dayRecords.some((r: any) => r.is_holiday);

    const startRowForDate = currentRowIndex;

    if (dayRecords.length === 0) {
      const r = worksheet.getRow(currentRowIndex);
      r.getCell(COL_FUEL_NAME).value = '';
      r.getCell(COL_ODO_START).value = dayData?.odometer_start ?? '';
      r.getCell(COL_ODO_END).value = dayData?.odometer_end ?? '';
      r.getCell(COL_MILEAGE).value = 0;
      r.getCell(COL_RECEIVED).value = '';
      r.getCell(COL_EXPENCE).value = 0;
      r.getCell(COL_BALANCE).value = '';
      r.getCell(COL_PURCHASE_SUM).value = '';
      currentRowIndex++;
    } else {
      dayRecords.forEach((rec: any, idx: number) => {
        const fuel = fuels.find((f: any) => f.id === rec.fuel_id);
        const rReceived = Number(rec.received_amount) || 0;
        const rExpence = Number(rec.fuel_expence) || 0;
        const rBalance = Number(rec.balance_after) || 0;
        const rPrice = Number(rec.fuel_price_at_time) || 0;
        const rPurchaseSum = rReceived * rPrice;

        const r = worksheet.getRow(currentRowIndex);
        r.getCell(COL_FUEL_NAME).value = fuel?.name || '';
        r.getCell(COL_ODO_START).value = Number(rec.odometer_start) || 0;
        r.getCell(COL_ODO_END).value = Number(rec.odometer_end) || 0;
        r.getCell(COL_MILEAGE).value = Number(rec.mileage) || 0;
        r.getCell(COL_RECEIVED).value = rReceived > 0 ? rReceived : '';
        r.getCell(COL_EXPENCE).value = rExpence;
        r.getCell(COL_BALANCE).value = rBalance;
        r.getCell(COL_PURCHASE_SUM).value =
          rPurchaseSum > 0 ? rPurchaseSum : '';

        if (rec.is_holiday) {
          holidayTotalPurchaseSum += rPurchaseSum;
          if (idx === 0)
            holidayTotalMileage +=
              Number(dayData?.mileage) || Number(rec.mileage) || 0;
        } else {
          grandTotalPurchaseSum += rPurchaseSum;
          if (idx === 0)
            grandTotalMileage +=
              Number(dayData?.mileage) || Number(rec.mileage) || 0;
        }

        currentRowIndex++;
      });
    }

    const endRowForDate = currentRowIndex - 1;
    const dateCell = worksheet.getCell(startRowForDate, COL_DATE);
    dateCell.value = displayDate;
    dateCell.font = { name: FONT_NAME, size: 8, bold: true };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (endRowForDate > startRowForDate) {
      worksheet.mergeCells(startRowForDate, COL_DATE, endRowForDate, COL_DATE);
    }

    for (let r = startRowForDate; r <= endRowForDate; r++) {
      worksheet.getRow(r).height = 16;
      for (let c = 1; c <= TOTAL_COLS; c++) {
        const cell = worksheet.getCell(r, c);
        cell.border = THIN_BORDER;
        cell.font = cell.font?.bold ? cell.font : { name: FONT_NAME, size: 8 };
        if (c === COL_DATE || c === COL_FUEL_NAME) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof cell.value === 'number') cell.numFmt = '#,##0.##';
        }
        if (isHoliday) cell.fill = HOLIDAY_FILL;
      }
    }
  }

  // ------------- Итого qatori (Asosiy) -------------
  const totalRowIndex = currentRowIndex;
  worksheet.mergeCells(totalRowIndex, COL_DATE, totalRowIndex, COL_FUEL_NAME);
  const totalRow = worksheet.getRow(totalRowIndex);
  totalRow.getCell(COL_DATE).value = 'Итого';
  totalRow.getCell(COL_ODO_START).value = '';
  totalRow.getCell(COL_ODO_END).value = '';
  totalRow.getCell(COL_MILEAGE).value = grandTotalMileage;
  totalRow.getCell(COL_RECEIVED).value = '—';
  totalRow.getCell(COL_EXPENCE).value = '—';
  totalRow.getCell(COL_BALANCE).value = '—';
  totalRow.getCell(COL_PURCHASE_SUM).value = grandTotalPurchaseSum;
  totalRow.height = 20;

  for (let c = 1; c <= TOTAL_COLS; c++) {
    const cell = totalRow.getCell(c);
    cell.font = { name: FONT_NAME, size: 8, bold: true };
    cell.fill = TOTAL_FILL;
    cell.border = THIN_BORDER;
    if (c === COL_DATE)
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    else {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (typeof cell.value === 'number') cell.numFmt = '#,##0';
    }
  }

  // ------------- Итого (дам олиш) qatori -------------
  const holidayTotalRowIndex = totalRowIndex + 1;
  worksheet.mergeCells(
    holidayTotalRowIndex,
    COL_DATE,
    holidayTotalRowIndex,
    COL_FUEL_NAME,
  );
  const holidayTotalRow = worksheet.getRow(holidayTotalRowIndex);
  holidayTotalRow.getCell(COL_DATE).value = 'Итого (дам олиш)';
  holidayTotalRow.getCell(COL_ODO_START).value = '';
  holidayTotalRow.getCell(COL_ODO_END).value = '';
  holidayTotalRow.getCell(COL_MILEAGE).value = holidayTotalMileage;
  holidayTotalRow.getCell(COL_RECEIVED).value = '—';
  holidayTotalRow.getCell(COL_EXPENCE).value = '—';
  holidayTotalRow.getCell(COL_BALANCE).value = '—';
  holidayTotalRow.getCell(COL_PURCHASE_SUM).value = holidayTotalPurchaseSum;
  holidayTotalRow.height = 20;

  for (let c = 1; c <= TOTAL_COLS; c++) {
    const cell = holidayTotalRow.getCell(c);
    cell.font = { name: FONT_NAME, size: 8, bold: true };
    cell.fill = HOLIDAY_FILL;
    cell.border = THIN_BORDER;
    if (c === COL_DATE)
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    else {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (typeof cell.value === 'number') cell.numFmt = '#,##0';
    }
  }

  // ------------- Жами (умумий) qatori -------------
  const grandTotalRowIndex = holidayTotalRowIndex + 1;
  worksheet.mergeCells(
    grandTotalRowIndex,
    COL_DATE,
    grandTotalRowIndex,
    COL_FUEL_NAME,
  );
  const grandTotalRow = worksheet.getRow(grandTotalRowIndex);
  grandTotalRow.getCell(COL_DATE).value = 'Жами (умумий)';
  grandTotalRow.getCell(COL_ODO_START).value = '';
  grandTotalRow.getCell(COL_ODO_END).value = '';
  grandTotalRow.getCell(COL_MILEAGE).value =
    grandTotalMileage + holidayTotalMileage;
  grandTotalRow.getCell(COL_RECEIVED).value = '—';
  grandTotalRow.getCell(COL_EXPENCE).value = '—';
  grandTotalRow.getCell(COL_BALANCE).value = '—';
  grandTotalRow.getCell(COL_PURCHASE_SUM).value =
    grandTotalPurchaseSum + holidayTotalPurchaseSum;
  grandTotalRow.height = 20;

  for (let c = 1; c <= TOTAL_COLS; c++) {
    const cell = grandTotalRow.getCell(c);
    cell.font = { name: FONT_NAME, size: 8, bold: true };
    cell.fill = GRAND_TOTAL_FILL;
    cell.border = THIN_BORDER;
    if (c === COL_DATE)
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    else {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (typeof cell.value === 'number') cell.numFmt = '#,##0';
    }
  }

  currentRowIndex = grandTotalRowIndex + 2;

  // ------------- Сальдо bloki -------------
  fuels.forEach((fuel: any) => {
    const s = summaryByFuel[fuel.id] || {};
    const tMain = totals.find((t: any) => t.fuel_id === fuel.id) || {
      total_received_amount: 0,
      total_fuel_expence: 0,
    };
    const tHol = holiday_totals.find((t: any) => t.fuel_id === fuel.id) || {
      total_received_amount: 0,
      total_fuel_expence: 0,
    };

    const items = [
      {
        label: `Сальдо на начало месяца (${fuel.name}):`,
        val: s.start_balance ?? 0,
      },
      {
        label: `Получено за месяц (${fuel.name}):`,
        val: s.total_received ?? tMain.total_received_amount,
      },
      {
        label: `Расход за месяц - асосий (${fuel.name}):`,
        val: s.total_expence ?? tMain.total_fuel_expence,
      },
      {
        label: `Расход за месяц - дам олиш (${fuel.name}):`,
        val: tHol.total_fuel_expence,
      },
      {
        label: `Расход за месяц - жами (${fuel.name}):`,
        val:
          (s.total_expence ?? tMain.total_fuel_expence) +
          tHol.total_fuel_expence,
      },
      {
        label: `Сальдо на конец месяца (${fuel.name}):`,
        val: s.end_balance ?? 0,
      },
      {
        label: `Стоимость топлива за месяц (${fuel.name}):`,
        val: s.total_received_price ?? 0,
      },
    ];

    items.forEach((item) => {
      worksheet.mergeCells(currentRowIndex, 1, currentRowIndex, 4);
      const lblCell = worksheet.getCell(currentRowIndex, 1);
      lblCell.value = item.label;
      lblCell.font = { name: FONT_NAME, size: 8, bold: true };
      lblCell.alignment = { horizontal: 'left', vertical: 'middle' };

      const valCell = worksheet.getCell(currentRowIndex, 5);
      valCell.value = Number(item.val) || 0;
      valCell.font = { name: FONT_NAME, size: 8, bold: true };
      valCell.alignment = { horizontal: 'right', vertical: 'middle' };
      valCell.numFmt = '#,##0.##';

      for (let c = 1; c <= 5; c++) {
        worksheet.getCell(currentRowIndex, c).border = THIN_BORDER;
      }
      worksheet.getRow(currentRowIndex).height = 16;
      currentRowIndex++;
    });

    currentRowIndex++;
  });

  worksheet.getColumn(COL_DATE).width = 11;
  worksheet.getColumn(COL_FUEL_NAME).width = 12;
  worksheet.getColumn(COL_ODO_START).width = 11;
  worksheet.getColumn(COL_ODO_END).width = 11;
  worksheet.getColumn(COL_MILEAGE).width = 9;
  worksheet.getColumn(COL_RECEIVED).width = 10;
  worksheet.getColumn(COL_EXPENCE).width = 10;
  worksheet.getColumn(COL_BALANCE).width = 10;
  worksheet.getColumn(COL_PURCHASE_SUM).width = 13;

  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.paperSize = 9;
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;
  worksheet.pageSetup.horizontalCentered = true;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
