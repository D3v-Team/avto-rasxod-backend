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
const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

// Ustunlar soni ENDI DOIM 9 TA — yoqilg'i turlari soniga bog'liq EMAS
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
  } = reportData;

  const monthName = CYRILLIC_MONTHS[month] || `${month}-ой`;
  const daysInMonth = new Date(year, month, 0).getDate();
  const fuelNamesStr = fuels.map((f: any) => f.name).join(', ');

  // ------------- Sarlavha -------------
  worksheet.mergeCells(1, 1, 1, TOTAL_COLS);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `Расход ${fuelNamesStr} на автомобиль ${car?.name || ''} ${car?.plate_number || ''} согласно путевым листам за ${monthName} ${year} года`;
  titleCell.font = { name: FONT_NAME, size: 10, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.getRow(1).height = 26;

  // ------------- Header (bitta qator, ustunlar soni FIKS) -------------
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
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = HEADER_FILL;
    cell.border = THIN_BORDER;
  });
  headerRow.height = 26;

  // ------------- Kunlar bo'yicha qatorlar -------------
  let currentRowIndex = 3;
  let grandTotalMileage = 0;
  let grandTotalPurchaseSum = 0;
  const totalsByFuel: Record<string, { received: number; expence: number }> = {};
  fuels.forEach((f: any) => {
    totalsByFuel[f.id] = { received: 0, expence: 0 };
  });

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
      // Yozuv yo'q kun — BITTA qator, spidometr o'zgarmagan holda
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
      // Har bir fuel yozuvi UCHUN ALOHIDA QATOR, sana keyin merge qilinadi
      dayRecords.forEach((rec: any, idx: number) => {
        const fuel = fuels.find((f: any) => f.id === rec.fuel_id);
        const rReceived = Number(rec.received_amount) || 0;
        const rExpence = Number(rec.fuel_expence) || 0;
        const rBalance = Number(rec.balance_after) || 0;
        const rPrice = Number(rec.fuel_price_at_time) || fuel?.price || 0;
        const rPurchaseSum = rReceived * rPrice;

        const r = worksheet.getRow(currentRowIndex);
        r.getCell(COL_FUEL_NAME).value = fuel?.name || '';
        r.getCell(COL_ODO_START).value = Number(rec.odometer_start) || 0;
        r.getCell(COL_ODO_END).value = Number(rec.odometer_end) || 0;
        r.getCell(COL_MILEAGE).value = Number(rec.mileage) || 0;
        r.getCell(COL_RECEIVED).value = rReceived > 0 ? rReceived : '';
        r.getCell(COL_EXPENCE).value = rExpence;
        r.getCell(COL_BALANCE).value = rBalance;
        r.getCell(COL_PURCHASE_SUM).value = rPurchaseSum > 0 ? rPurchaseSum : '';

        if (rec.fuel_id && totalsByFuel[rec.fuel_id]) {
          totalsByFuel[rec.fuel_id].received += rReceived;
          totalsByFuel[rec.fuel_id].expence += rExpence;
        }
        grandTotalPurchaseSum += rPurchaseSum;

        // Kunlik jami masofa — FAQAT bir marta (birinchi yozuvdan) qo'shiladi,
        // aks holda bir kunda bir necha fuel bo'lsa km ikki marta hisoblanib ketadi
        if (idx === 0) {
          grandTotalMileage += Number(dayData?.mileage) || Number(rec.mileage) || 0;
        }

        currentRowIndex++;
      });
    }

    const endRowForDate = currentRowIndex - 1;

    // Sana ustunini shu kunning barcha qatorlari bo'ylab BIR MARTA yozib, MERGE qilish
    const dateCell = worksheet.getCell(startRowForDate, COL_DATE);
    dateCell.value = displayDate;
    dateCell.font = { name: FONT_NAME, size: 8, bold: true };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    if (endRowForDate > startRowForDate) {
      worksheet.mergeCells(startRowForDate, COL_DATE, endRowForDate, COL_DATE);
    }

    // Formatlash — shu kunga tegishli BARCHA qatorlar (Date merge qilingandan keyin)
    for (let r = startRowForDate; r <= endRowForDate; r++) {
      worksheet.getRow(r).height = 16;
      for (let c = 1; c <= TOTAL_COLS; c++) {
        const cell = worksheet.getCell(r, c);
        cell.border = THIN_BORDER;
        cell.font = cell.font?.bold
          ? cell.font
          : { name: FONT_NAME, size: 8 };
        if (c === COL_DATE || c === COL_FUEL_NAME) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          if (typeof cell.value === 'number') {
            cell.numFmt = '#,##0.##';
          }
        }
        if (isHoliday) {
          cell.fill = HOLIDAY_FILL;
        }
      }
    }
  }

  // ------------- Итого qatori -------------
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
    if (c === COL_DATE) {
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    } else {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      if (typeof cell.value === 'number') {
        cell.numFmt = '#,##0';
      }
    }
  }

  currentRowIndex = totalRowIndex + 2;

  // ------------- Сальдо bloki, har bir yoqilg'i turi bo'yicha -------------
  fuels.forEach((fuel: any) => {
    const s = summaryByFuel[fuel.id] || {};
    const t = totalsByFuel[fuel.id] || { received: 0, expence: 0 };

    const items = [
      { label: `Сальдо на начало месяца (${fuel.name}):`, val: s.start_balance ?? 0 },
      { label: `Получено за месяц (${fuel.name}):`, val: s.total_received ?? t.received },
      { label: `Расход за месяц (${fuel.name}):`, val: s.total_expence ?? t.expence },
      { label: `Сальдо на конец месяца (${fuel.name}):`, val: s.end_balance ?? 0 },
      { label: `Стоимость топлива за месяц (${fuel.name}):`, val: s.total_received_price ?? 0 },
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

  // ------------- Ustun kengliklari -------------
  worksheet.getColumn(COL_DATE).width = 11;
  worksheet.getColumn(COL_FUEL_NAME).width = 12;
  worksheet.getColumn(COL_ODO_START).width = 11;
  worksheet.getColumn(COL_ODO_END).width = 11;
  worksheet.getColumn(COL_MILEAGE).width = 9;
  worksheet.getColumn(COL_RECEIVED).width = 10;
  worksheet.getColumn(COL_EXPENCE).width = 10;
  worksheet.getColumn(COL_BALANCE).width = 10;
  worksheet.getColumn(COL_PURCHASE_SUM).width = 13;

  // ------------- A4 ga moslash (landscape, bitta sahifa kengligiga) -------------
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.paperSize = 9; // A4
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;
  worksheet.pageSetup.horizontalCentered = true;

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
