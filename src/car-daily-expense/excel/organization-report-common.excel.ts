import * as ExcelJS from 'exceljs';

export const CYRILLIC_MONTHS: Record<number, string> = {
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

// 1. Dinamik fuel ustunlari header qurish
export function buildHeaderRows(
  worksheet: ExcelJS.Worksheet,
  year: number,
  monthName: string,
  fuels: any[]
): { totalCols: number, totalSumCol: number, holidayStartCol: number } {
  const totalCols = 4 + fuels.length * 4 + 1 + 3;

  worksheet.mergeCells(1, 1, 1, totalCols);
  const titleCell = worksheet.getCell(1, 1);
  titleCell.value = `ЎКУФ Сирдарё вилоят кенгаши балансидаги автотранспорт воситалари томонидан ${year} йил ${monthName} ойида сарфланган ёқилғи харажатлари бўйича Хисобот`;
  titleCell.font = { name: 'Arial', size: 12, bold: true };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.getRow(1).height = 35;

  worksheet.mergeCells(2, 1, 3, 1);
  worksheet.getCell(2, 1).value = '№';

  worksheet.mergeCells(2, 2, 3, 2); 
  worksheet.getCell(2, 2).value = 'Автомобиль маркаси ва номери';

  worksheet.mergeCells(2, 3, 3, 3); 
  worksheet.getCell(2, 3).value = 'Бириктирилган масъуллар';

  worksheet.mergeCells(2, 4, 3, 4); 
  worksheet.getCell(2, 4).value = 'Юрилган масофа км';
  
  let currentColIndex = 5; 

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

  const totalSumCol = currentColIndex;
  worksheet.mergeCells(2, totalSumCol, 3, totalSumCol);
  worksheet.getCell(2, totalSumCol).value = 'Умумий суммаси';
  currentColIndex += 1;

  const holidayStartCol = currentColIndex;
  worksheet.mergeCells(2, holidayStartCol, 2, holidayStartCol + 2);
  worksheet.getCell(2, holidayStartCol).value = 'Дам олиш кунлари ва байрам саналарида';
  worksheet.getCell(3, holidayStartCol).value = 'км';
  worksheet.getCell(3, holidayStartCol + 1).value = 'миқдор';
  worksheet.getCell(3, holidayStartCol + 2).value = 'суммаси';

  [2, 3].forEach((rowNum) => {
    const row = worksheet.getRow(rowNum);
    row.height = 25;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (colNumber <= totalCols) {
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
      }
    });
  });

  return { totalCols, totalSumCol, holidayStartCol };
}

// 2. Raqam formatlash va border qo'yish
export function formatDataRow(row: ExcelJS.Row, totalCols: number, isSummary: boolean = false, isGroupHeader: boolean = false, bgColor: string = '') {
  for (let colNumber = 1; colNumber <= totalCols; colNumber++) {
    const cell = row.getCell(colNumber);
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    if (isGroupHeader) {
      cell.font = { name: 'Arial', size: 11, bold: true };
      if (bgColor) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      }
      if (colNumber === 1 || colNumber === 2) {
         cell.alignment = { vertical: 'middle', horizontal: 'left' };
      }
    } else if (isSummary) {
      cell.font = { name: 'Arial', size: 10, bold: true };
      if (bgColor) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
      }
      if (colNumber === 2 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (cell.value !== '—') {
          cell.numFmt = '#,##0';
        }
      }
    } else {
      if (colNumber === 2 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      } else if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (cell.value !== '—' && typeof cell.value === 'number') {
           cell.numFmt = '#,##0';
        }
      }
    }
  }
}

export function setColumnWidths(worksheet: ExcelJS.Worksheet, totalCols: number) {
  worksheet.getColumn(1).width = 6;
  worksheet.getColumn(2).width = 25; 
  worksheet.getColumn(3).width = 28; 
  worksheet.getColumn(4).width = 16; 
  
  for (let c = 5; c <= totalCols; c++) {
    worksheet.getColumn(c).width = 16;
  }
}
