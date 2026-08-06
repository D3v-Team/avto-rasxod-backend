import * as ExcelJS from 'exceljs';

export const CYRILLIC_MONTHS: Record<number, string> = {
  1: 'Январь', 2: 'Феврал', 3: 'Март', 4: 'Апрель', 5: 'Май', 6: 'Июнь',
  7: 'Июль', 8: 'Август', 9: 'Сентябр', 10: 'Октябр', 11: 'Ноябр', 12: 'Декабр',
};

export const FONT_NAME = 'Arial';

export const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' },
};
export const CAR_TITLE_FILL: ExcelJS.Fill = {
  type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' },
};
export const JAMI_FILL: ExcelJS.Fill = {
  type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC9C9C9' },
};
export const GRAND_FILL: ExcelJS.Fill = {
  type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB0B0B0' },
};

export const THIN_BORDER: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

// Bitta A4 landscape sahifaga (chekka + shrift bilan) qulay sig'adigan
// yoqilg'i turlari soni. Bundan ko'p bo'lsa, keyingi sheet'ga o'tkaziladi.
export const MAX_FUELS_PER_SHEET = 3;

export interface FuelRef {
  id: string;
  name: string;
  unit: string;
}

// Ustunlar: 1:№ 2:Масъуллар 3:Юрилган км
// 4..(4+3F-1): Ой бошига қолдиқ (har fuel uchun 1 ustun)
// keyin: Ой давомида сарфланган (har fuel uchun 2 ustun: миqdor+сумма) + Умумий суммаси (1 ustun)
// keyin: Ой охирига қолдиқ (har fuel uchun 1 ustun)
// keyin: Дам олиш кунлари (3 ustun: км, миqdor, сумма)
export function buildHeaderRows(
  worksheet: ExcelJS.Worksheet,
  year: number,
  monthName: string,
  fuels: FuelRef[],
): {
  totalCols: number;
  startBalanceCol: number;
  consumedStartCol: number;
  totalSumCol: number;
  endBalanceCol: number;
  holidayStartCol: number;
} {
  const fuelCount = fuels.length;
  const startBalanceCol = 4;
  const consumedStartCol = startBalanceCol + fuelCount;
  const totalSumCol = consumedStartCol + fuelCount * 2;
  const endBalanceCol = totalSumCol + 1;
  const holidayStartCol = endBalanceCol + fuelCount;
  const totalCols = holidayStartCol + 2;

  worksheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `ЎКУФ Сирдарё вилоят кенгаши балансидаги автотранспорт воситалари томонидан ${year} йил ${monthName} ойида сарфланган ёқилғи харажатлари бўйича Хисобот`;
  titleCell.font = { name: FONT_NAME, size: 10, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.getRow(1).height = 26;

  worksheet.mergeCells(2, 1, 3, 1);
  worksheet.getCell(2, 1).value = '№';

  worksheet.mergeCells(2, 2, 3, 2);
  worksheet.getCell(2, 2).value = 'Бириктирилган масъуллар';

  worksheet.mergeCells(2, 3, 3, 3);
  worksheet.getCell(2, 3).value = 'Юрилган масофа км';

  // Ой бошига қолдиқ
  worksheet.mergeCells(2, startBalanceCol, 2, startBalanceCol + fuelCount - 1);
  worksheet.getCell(2, startBalanceCol).value = 'Ой бошига қолдиқ';
  fuels.forEach((fuel, i) => {
    worksheet.getCell(3, startBalanceCol + i).value = `${fuel.name} ${fuel.unit}`;
  });

  // Ой давомида сарфланган (har fuel: миqdor + сумма)
  worksheet.mergeCells(2, consumedStartCol, 2, consumedStartCol + fuelCount * 2 - 1);
  worksheet.getCell(2, consumedStartCol).value = 'Ой давомида сарфланган';
  fuels.forEach((fuel, i) => {
    const col = consumedStartCol + i * 2;
    worksheet.getCell(3, col).value = `${fuel.name} ${fuel.unit}`;
    worksheet.getCell(3, col + 1).value = 'суммаси';
  });

  // Умумий суммаси
  worksheet.mergeCells(2, totalSumCol, 3, totalSumCol);
  worksheet.getCell(2, totalSumCol).value = 'Умумий суммаси';

  // Ой охирига қолдиқ
  worksheet.mergeCells(2, endBalanceCol, 2, endBalanceCol + fuelCount - 1);
  worksheet.getCell(2, endBalanceCol).value = 'Ой охирига қолдиқ';
  fuels.forEach((fuel, i) => {
    worksheet.getCell(3, endBalanceCol + i).value = `${fuel.name} ${fuel.unit}`;
  });

  // Дам олиш кунлари
  worksheet.mergeCells(2, holidayStartCol, 2, holidayStartCol + 2);
  worksheet.getCell(2, holidayStartCol).value = 'Дам олиш кунлари ва байрам саналарида';
  worksheet.getCell(3, holidayStartCol).value = 'км';
  worksheet.getCell(3, holidayStartCol + 1).value = 'миқдор';
  worksheet.getCell(3, holidayStartCol + 2).value = 'суммаси';

  [2, 3].forEach((rowNum) => {
    const row = worksheet.getRow(rowNum);
    row.height = rowNum === 2 ? 26 : 20;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= totalCols) {
        cell.font = { name: FONT_NAME, size: 7, bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = HEADER_FILL;
        cell.border = THIN_BORDER;
      }
    });
  });

  return { totalCols, startBalanceCol, consumedStartCol, totalSumCol, endBalanceCol, holidayStartCol };
}

export function styleDataCell(
  cell: ExcelJS.Cell,
  opts: { bold?: boolean; fill?: ExcelJS.Fill; align?: 'left' | 'center' | 'right' } = {},
) {
  cell.border = THIN_BORDER;
  cell.font = { name: FONT_NAME, size: 7.5, bold: !!opts.bold };
  cell.alignment = {
    vertical: 'middle',
    horizontal: opts.align || 'right',
    wrapText: true,
  };
  if (opts.fill) cell.fill = opts.fill;
  if (typeof cell.value === 'number') {
    cell.numFmt = '#,##0';
  }
}

// A4 landscape'ga to'liq sig'dirish uchun sahifa sozlamalari
export function applyA4LandscapeSetup(worksheet: ExcelJS.Worksheet) {
  worksheet.pageSetup.orientation = 'landscape';
  worksheet.pageSetup.paperSize = 9; // A4
  worksheet.pageSetup.fitToPage = true;
  worksheet.pageSetup.fitToWidth = 1;
  worksheet.pageSetup.fitToHeight = 0;
  worksheet.pageSetup.horizontalCentered = true;
  worksheet.pageSetup.margins = {
    left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2,
  };
}

// Ustun kengliklari — 19 ustunli (3 fuel) tarkib A4 landscape'ga sig'adigan
// taxminiy kengliklar. Fuel soni kamroq bo'lsa ustunlar avtomatik kengroq
// bo'lib qolishi mumkin, bu muammo emas.
export function setColumnWidths(
  worksheet: ExcelJS.Worksheet,
  totalCols: number,
) {
  worksheet.getColumn(1).width = 4;
  worksheet.getColumn(2).width = 26;
  worksheet.getColumn(3).width = 9;
  for (let c = 4; c <= totalCols; c++) {
    worksheet.getColumn(c).width = 8;
  }
}



export function formatDataRow(
  row: ExcelJS.Row,
  totalCols: number = 19,
  isSummary: boolean = false,
  isGroupHeader: boolean = false,
  bgColor: string = ''
) {
  row.height = isGroupHeader ? 18 : isSummary ? 20 : 28;

  for (let colNumber = 1; colNumber <= totalCols; colNumber++) {
    const cell = row.getCell(colNumber);
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };

    if (isGroupHeader) {
      cell.font = { name: 'Arial', size: 8, bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor || 'FFFAFAFA' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else if (isSummary) {
      cell.font = { name: 'Arial', size: 8, bold: true };
      if (bgColor) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 2 ? 'center' : 'right' };
      if (typeof cell.value === 'number') cell.numFmt = '#,##0';
    } else {
      cell.font = { name: 'Arial', size: 7.5 };
      if (bgColor) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };

      if (colNumber === 1) cell.alignment = { vertical: 'middle', horizontal: 'center' };
      else if (colNumber === 2) cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (typeof cell.value === 'number' && cell.value !== 0) cell.numFmt = '#,##0';
      }
    }
  }
}

export async function generateOrganizationReportWorkbook(reportData: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Хисобот');

  applyA4LandscapeSetup(worksheet);

  const year = reportData.year;
  const month = reportData.month;
  const monthName = CYRILLIC_MONTHS[month] || `${month}-ой`;

  const { totalCols } = buildHeaderRows(worksheet, year, monthName, reportData.fuels);
  let currentRowIndex = 4;

  if (Array.isArray(reportData.groups)) {
    reportData.groups.forEach((group: any, groupIdx: number) => {

      if (Array.isArray(group.cars)) {
        group.cars.forEach((carItem: any, carIdx: number) => {

          // 1. Mashina modeli va raqami (Alohida guruh sarlavhasi qatori)
          const carHeaderRow = worksheet.getRow(currentRowIndex);
          const carName = carItem.car?.name || '';
          const plateNumber = carItem.car?.plate_number || '';

          worksheet.mergeCells(currentRowIndex, 1, currentRowIndex, totalCols);
          carHeaderRow.getCell(1).value = `${carName.toUpperCase()} - ${plateNumber.toUpperCase()}`;
          formatDataRow(carHeaderRow, totalCols, false, true, 'FFFAFAFA');
          currentRowIndex++;

          // 2. Avto ma'lumotlari haqiqiy qatori
          const row = worksheet.getRow(currentRowIndex);

          const benzin = carItem.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('benzin') || f.fuel_id === 'benzin');
          const gaz = carItem.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('gaz') || f.fuel_id === 'gaz');
          const propan = carItem.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('propan') || f.fuel_id === 'propan');

          const respName = carItem.car?.responsible_employee?.full_name || group.responsible_employee?.full_name || '';
          const respRole = carItem.car?.responsible_employee?.role || group.responsible_employee?.role || 'Масъул';
          const drvName = carItem.car?.driver?.full_name || '—';

          // 1-ustun (A): №
          row.getCell(1).value = groupIdx + 1;

          // 2-ustun (B): Mas'ul va Haydovchi ismlari
          let respStr = respName ? `${respRole}: ${respName}` : '';
          let drvStr = drvName !== '—' ? `Ҳайдовчи: ${drvName}` : '';
          row.getCell(2).value = [respStr, drvStr].filter(Boolean).join('\n') || '—';

          // 3-ustun (C): Юрилган масофа км
          row.getCell(3).value = Number(carItem.total_mileage) || 0;

          // 4-6 ustunlar (D, E, F): Ой бошига қолдиқ (Benzin, Gaz, Propan)
          row.getCell(4).value = Number(benzin?.start_balance) || 0;
          row.getCell(5).value = Number(gaz?.start_balance) || 0;
          row.getCell(6).value = Number(propan?.start_balance) || 0;

          // 7-12 ustunlar (G, H, I, J, K, L): Ой давомида сарфланган (olingan yoqilg'i jami hajmi va summasi)
          row.getCell(7).value = Number(benzin?.consumed_amount) || 0;
          row.getCell(8).value = Number(benzin?.consumed_sum) || 0;
          row.getCell(9).value = Number(gaz?.consumed_amount) || 0;
          row.getCell(10).value = Number(gaz?.consumed_sum) || 0;
          row.getCell(11).value = Number(propan?.consumed_amount) || 0;
          row.getCell(12).value = Number(propan?.consumed_sum) || 0;

          // 13-ustun (M): Умумий суммаси (Benzin summasi [H] + Gaz summasi [J] + Propan summasi [L])
          // Dynamic ravishda joriy qator formulasini beramiz: H + J + L
          row.getCell(13).value = { formula: `H${currentRowIndex}+J${currentRowIndex}+L${currentRowIndex}` };

          // 14-16 ustunlar (N, O, P): Ой охирига қолдиқ
          row.getCell(14).value = Number(benzin?.end_balance) || 0;
          row.getCell(15).value = Number(gaz?.end_balance) || 0;
          row.getCell(16).value = Number(propan?.end_balance) || 0;

          // 17-19 ustunlar (Q, R, S): Дам олиш кунлари
          row.getCell(17).value = Number(carItem.holiday?.km) || 0;
          row.getCell(18).value = Number(carItem.holiday?.amount) || 0;
          row.getCell(19).value = Number(carItem.holiday?.sum) || 0;

          formatDataRow(row, totalCols, false, false);
          currentRowIndex++;
        });
      }

      // 3. GURUH BO'YICHA JAMI (Жами qatori)
      const groupTotal = group.group_total;
      if (groupTotal) {
        const groupTotalRow = worksheet.getRow(currentRowIndex);

        groupTotalRow.getCell(2).value = 'Жами';
        groupTotalRow.getCell(3).value = Number(groupTotal.total_mileage) || 0;

        // Qoldiqlar jami "—" bo'ladi
        groupTotalRow.getCell(4).value = '—';
        groupTotalRow.getCell(5).value = '—';
        groupTotalRow.getCell(6).value = '—';

        const gtBenzin = groupTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('benzin') || f.fuel_id === 'benzin');
        const gtGaz = groupTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('gaz') || f.fuel_id === 'gaz');
        const gtPropan = groupTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('propan') || f.fuel_id === 'propan');

        groupTotalRow.getCell(7).value = Number(gtBenzin?.total_consumed_amount) || 0;
        groupTotalRow.getCell(8).value = Number(gtBenzin?.total_consumed_sum) || 0;
        groupTotalRow.getCell(9).value = Number(gtGaz?.total_consumed_amount) || 0;
        groupTotalRow.getCell(10).value = Number(gtGaz?.total_consumed_sum) || 0;
        groupTotalRow.getCell(11).value = Number(gtPropan?.total_consumed_amount) || 0;
        groupTotalRow.getCell(12).value = Number(gtPropan?.total_consumed_sum) || 0;
        
        // Guruh umumiy summasi formula orqali: H + J + L
        groupTotalRow.getCell(13).value = { formula: `H${currentRowIndex}+J${currentRowIndex}+L${currentRowIndex}` };

        groupTotalRow.getCell(14).value = '—';
        groupTotalRow.getCell(15).value = '—';
        groupTotalRow.getCell(16).value = '—';

        groupTotalRow.getCell(17).value = Number(groupTotal.holiday?.km) || 0;
        groupTotalRow.getCell(18).value = Number(groupTotal.holiday?.amount) || 0;
        groupTotalRow.getCell(19).value = Number(groupTotal.holiday?.sum) || 0;

        formatDataRow(groupTotalRow, totalCols, true, false, 'FFF0F0F0');
        currentRowIndex++;
      }
    });
  }

  // 4. GRAND TOTAL (Умумий жами)
  const grandTotal = reportData.grand_total;
  if (grandTotal) {
    const summaryRow = worksheet.getRow(currentRowIndex);
    summaryRow.getCell(2).value = 'Умумий жами';
    summaryRow.getCell(3).value = Number(grandTotal.total_mileage) || 0;

    summaryRow.getCell(4).value = '—';
    summaryRow.getCell(5).value = '—';
    summaryRow.getCell(6).value = '—';

    const grandBenzin = grandTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('benzin') || f.fuel_id === 'benzin');
    const grandGaz = grandTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('gaz') || f.fuel_id === 'gaz');
    const grandPropan = grandTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('propan') || f.fuel_id === 'propan');

    summaryRow.getCell(7).value = Number(grandBenzin?.total_consumed_amount) || 0;
    summaryRow.getCell(8).value = Number(grandBenzin?.total_consumed_sum) || 0;
    summaryRow.getCell(9).value = Number(grandGaz?.total_consumed_amount) || 0;
    summaryRow.getCell(10).value = Number(grandGaz?.total_consumed_sum) || 0;
    summaryRow.getCell(11).value = Number(grandPropan?.total_consumed_amount) || 0;
    summaryRow.getCell(12).value = Number(grandPropan?.total_consumed_sum) || 0;
    
    // Umumiy jami summasi ham formula orqali: H + J + L
    summaryRow.getCell(13).value = { formula: `H${currentRowIndex}+J${currentRowIndex}+L${currentRowIndex}` };

    summaryRow.getCell(14).value = '—';
    summaryRow.getCell(15).value = '—';
    summaryRow.getCell(16).value = '—';

    summaryRow.getCell(17).value = Number(grandTotal.holiday?.km) || 0;
    summaryRow.getCell(18).value = Number(grandTotal.holiday?.amount) || 0;
    summaryRow.getCell(19).value = Number(grandTotal.holiday?.sum) || 0;

    formatDataRow(summaryRow, totalCols, true, false, 'FFD3D3D3');
  }

  setColumnWidths(worksheet, totalCols);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}