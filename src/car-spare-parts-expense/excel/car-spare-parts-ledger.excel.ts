import * as ExcelJS from 'exceljs';
import { Car } from '../../cars/models/cars.models';
import { CarSparePartsExpense } from '../models/car-spare-parts-expense.model';

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}г`; // Rasmdagi kabi "г" bilan
};

export async function generateCarSparePartsLedgerExcel(
  expenses: CarSparePartsExpense[],
  cars: Car[],
  dateFrom: string,
  dateTo: string,
  orgName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('1040-счет');

  const borderAll: Partial<ExcelJS.Borders> = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  };

  const alignCenter: Partial<ExcelJS.Alignment> = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  };

  const endColIndex = 6 + cars.length * 2; // 6 ta statik ustun + har bir avto uchun 2 tadan

  // 1-qator: Sarlavha
  const org = orgName || 'Ташкилот';
  const fromFormatted = formatDate(dateFrom).replace('г', '');
  const toFormatted = formatDate(dateTo).replace('г', '');

  sheet.mergeCells(1, 1, 1, endColIndex);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = `${org} ${fromFormatted} — ${toFormatted} даврида 1040-счет бўйича авто эҳтиёт қисмлар харажати юзасидан ҳисобот`;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = alignCenter;
  sheet.getRow(1).height = 30;

  // 2-qator: Katta sarlavhalar
  sheet.getCell('A2').value = '№';
  sheet.getCell('B2').value = 'Дата';
  sheet.getCell('C2').value = '№ докум.';
  sheet.getCell('D2').value = 'Наименование авто/запч';
  sheet.getCell('E2').value = 'Дебет счетов';
  sheet.getCell('F2').value = 'Сумма накладной';

  sheet.mergeCells(2, 7, 2, endColIndex);
  const creditTitle = sheet.getCell(2, 7);
  creditTitle.value = 'Кредит счета 1040 (списываются на автомашины)';

  // 3-qator: Avtolar sarlavhasi
  let colIndex = 7;
  cars.forEach((car) => {
    sheet.mergeCells(3, colIndex, 3, colIndex + 1);
    sheet.getCell(3, colIndex).value = `${car.name} (${car.plate_number})`;
    colIndex += 2;
  });

  // 4-qator: soni / summasi
  colIndex = 7;
  cars.forEach(() => {
    sheet.getCell(4, colIndex).value = 'сони';
    sheet.getCell(4, colIndex + 1).value = 'суммаси';
    colIndex += 2;
  });

  // Statik ustunlarni vertikal merge qilish (qator 2 dan 4 gacha)
  ['A', 'B', 'C', 'D', 'E', 'F'].forEach((col, i) => {
    sheet.mergeCells(`${col}2:${col}4`);
    const cell = sheet.getCell(`${col}2`);
    cell.font = { bold: true };
    cell.alignment = alignCenter;
  });

  sheet.getRow(2).font = { bold: true };
  sheet.getRow(3).font = { bold: true };
  sheet.getRow(4).font = { bold: true };
  sheet.getRow(2).alignment = alignCenter;
  sheet.getRow(3).alignment = alignCenter;
  sheet.getRow(4).alignment = alignCenter;

  // Ustun kengliklari
  sheet.getColumn(1).width = 5;
  sheet.getColumn(2).width = 12;
  sheet.getColumn(3).width = 12;
  sheet.getColumn(4).width = 30;
  sheet.getColumn(5).width = 12;
  sheet.getColumn(6).width = 15;
  for (let i = 7; i <= endColIndex; i++) {
    sheet.getColumn(i).width = 12;
  }

  // Ma'lumotlarni yozish
  let currentRowNum = 5;
  let counter = 1;
  const carSums: Record<string, number> = {};
  let totalSum = 0;

  // Guruhlash o'zgaruvchilari
  let currentGroupKey = '';
  let groupStartRow = currentRowNum;

  expenses.forEach((expense, index) => {
    const dateStr = formatDate(expense.date);
    const docNum = ''; // Bazada haqiqiy hujjat raqami mavjud emas, ustun bo'sh qoldiriladi
    const groupKey = dateStr;

    // Agar guruh o'zgarsa (va bu birinchi qator bo'lmasa), oldingi guruhni merge qilamiz
    if (groupKey !== currentGroupKey && currentGroupKey !== '') {
      if (currentRowNum - 1 > groupStartRow) {
        sheet.mergeCells(`B${groupStartRow}:B${currentRowNum - 1}`);
        sheet.mergeCells(`C${groupStartRow}:C${currentRowNum - 1}`);
      }
      groupStartRow = currentRowNum;
    }
    currentGroupKey = groupKey;

    const row = sheet.getRow(currentRowNum);
    row.getCell(1).value = counter++;
    row.getCell(2).value = dateStr;
    row.getCell(3).value = docNum;
    row.getCell(4).value = expense.part_name;
    row.getCell(5).value = ''; // Дебет счетов doim bo'sh

    const price = Number(expense.total_price) || 0;
    row.getCell(6).value = price;
    totalSum += price;

    colIndex = 7;
    cars.forEach((car) => {
      if (car.id === expense.car_id) {
        row.getCell(colIndex).value = `${expense.quantity} ${expense.unit}`;
        row.getCell(colIndex + 1).value = price;
        carSums[car.id] = (carSums[car.id] || 0) + price;
      }
      colIndex += 2;
    });

    // Formatting for current row
    for (let i = 1; i <= endColIndex; i++) {
      row.getCell(i).border = borderAll;
      if (i === 6 || (i >= 7 && (i - 7) % 2 === 1)) {
        row.getCell(i).numFmt = '#,##0';
      }
      // Vertikal markazlashtirish (merge uchun chiroyli ko'rinadi)
      row.getCell(i).alignment = { vertical: 'middle' };
    }

    currentRowNum++;

    // Oxirgi qator bo'lsa, qolgan guruhni merge qilib qo'yish
    if (index === expenses.length - 1) {
      if (currentRowNum - 1 > groupStartRow) {
        sheet.mergeCells(`B${groupStartRow}:B${currentRowNum - 1}`);
        sheet.mergeCells(`C${groupStartRow}:C${currentRowNum - 1}`);
      }
    }
  });

  // Jami qatori
  sheet.mergeCells(`A${currentRowNum}:E${currentRowNum}`);
  const totalLabel = sheet.getCell(currentRowNum, 1);
  totalLabel.value = 'Жами';
  totalLabel.font = { bold: true };
  totalLabel.alignment = { horizontal: 'right', vertical: 'middle' };

  const finalTotalCell = sheet.getCell(currentRowNum, 6);
  finalTotalCell.value = totalSum;
  finalTotalCell.font = { bold: true };
  finalTotalCell.numFmt = '#,##0';

  colIndex = 7;
  cars.forEach((car) => {
    // Soni bo'sh qoladi
    const sumCell = sheet.getCell(currentRowNum, colIndex + 1);
    sumCell.value = carSums[car.id] || 0;
    sumCell.font = { bold: true };
    sumCell.numFmt = '#,##0';
    colIndex += 2;
  });

  for (let i = 1; i <= endColIndex; i++) {
    sheet.getCell(currentRowNum, i).border = borderAll;
  }

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}
