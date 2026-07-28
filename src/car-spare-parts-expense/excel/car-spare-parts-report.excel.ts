import * as ExcelJS from 'exceljs';
import { Car } from '../../cars/models/cars.models';
import { CarSparePartsExpense } from '../models/car-spare-parts-expense.model';

// Sana string'ni "kun.oy.yil" formatiga o'girish
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
};

export async function generateCarSparePartsReportExcel(
  cars: (Car & { car_spare_parts_expenses: CarSparePartsExpense[] })[],
  dateFrom: string,
  dateTo: string,
  orgName: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Avto Rasxod System';
  
  const sheet = workbook.addWorksheet('Ehtiyot qismlar hisoboti');

  // Format definitions
  const borderAll = {
    top: { style: 'thin' as ExcelJS.BorderStyle },
    left: { style: 'thin' as ExcelJS.BorderStyle },
    bottom: { style: 'thin' as ExcelJS.BorderStyle },
    right: { style: 'thin' as ExcelJS.BorderStyle },
  };

  const numFormat = '#,##0.00'; // Or '#,##0' depending on exact requirement, but typically decimal is needed. Since example is 1,650,000 we'll use '#,##0' if we don't want decimals, but price has decimal. Let's use '#,##0.00' for price and '#,##0.##' for quantity. Actually, prompt says "minglik ажратгичи bilan (masalan 1,650,000)", so let's use '#,##0'. I'll use '#,##0' for quantity, and '#,##0.00' for prices. 

  // Column widths: A=5, B=12, C=15, D=30, E=10, F=15, G=15, H=15
  sheet.columns = [
    { key: 'A', width: 5 },
    { key: 'B', width: 12 },
    { key: 'C', width: 15 },
    { key: 'D', width: 30 },
    { key: 'E', width: 10 },
    { key: 'F', width: 15 },
    { key: 'G', width: 18 },
    { key: 'H', width: 18 },
  ];

  // 1. Fayl sarlavhasi
  const titleStr = `${orgName} ${formatDate(dateFrom)} дан ${formatDate(dateTo)} гача бўлган авто эхтиёт қисмлар сарфи ҳисоботи`;
  sheet.mergeCells('A1:H1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = titleStr;
  titleCell.font = { bold: true, size: 12 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 2. Bo'sh qator
  // already row 2 is empty

  // 3. Ustunlar sarlavhasi
  const headerRow = sheet.getRow(3);
  const headers = [
    '№',
    'Сана',
    'Тўлов тури',
    'Маҳсулот номи',
    'Сони',
    'Ўлчов бирлиги',
    'Бир донаси нархи',
    'Умумий нархи',
  ];
  headers.forEach((h, idx) => {
    const cell = headerRow.getCell(idx + 1);
    cell.value = h;
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' }, // light grey
    };
    cell.border = borderAll;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  let currentRowNum = 4;
  let grandTotal = 0;

  // 4. Har bir avto uchun iteratsiya
  for (const car of cars) {
    const expenses = car.car_spare_parts_expenses || [];
    
    // Avto sarlavhasi
    sheet.mergeCells(`A${currentRowNum}:H${currentRowNum}`);
    const carHeaderCell = sheet.getCell(`A${currentRowNum}`);
    carHeaderCell.value = `Автомобиль: ${car.name} — ${car.plate_number}`;
    carHeaderCell.font = { bold: true };
    carHeaderCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFBDD7EE' }, // blue-ish
    };
    carHeaderCell.border = borderAll;
    carHeaderCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Set borders for the merged cells properly
    for (let i = 1; i <= 8; i++) {
        sheet.getCell(currentRowNum, i).border = borderAll;
    }
    
    currentRowNum++;

    if (expenses.length === 0) {
      // Rasxod qilinmagan
      sheet.mergeCells(`A${currentRowNum}:H${currentRowNum}`);
      const noDataCell = sheet.getCell(`A${currentRowNum}`);
      noDataCell.value = 'Расход қилинмаган';
      noDataCell.font = { italic: true };
      noDataCell.alignment = { horizontal: 'center', vertical: 'middle' };
      for (let i = 1; i <= 8; i++) {
        sheet.getCell(currentRowNum, i).border = borderAll;
      }
      currentRowNum++;
    } else {
      // Rasxodlar ro'yxati
      let carTotal = 0;
      let orderNo = 1;
      
      for (const expense of expenses) {
        const row = sheet.getRow(currentRowNum);
        
        row.getCell(1).value = orderNo++;
        row.getCell(2).value = formatDate(expense.date);
        row.getCell(3).value = expense.payment_type;
        row.getCell(4).value = expense.part_name;
        row.getCell(5).value = Number(expense.quantity);
        row.getCell(6).value = expense.unit;
        row.getCell(7).value = Number(expense.price);
        row.getCell(8).value = Number(expense.total_price);
        
        row.getCell(5).numFmt = '#,##0.00';
        row.getCell(7).numFmt = '#,##0.00';
        row.getCell(8).numFmt = '#,##0.00';

        carTotal += Number(expense.total_price);

        for (let i = 1; i <= 8; i++) {
          row.getCell(i).border = borderAll;
          if (i === 1 || i === 2) {
             row.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
          }
        }
        
        currentRowNum++;
      }

      // Jami qatori
      sheet.mergeCells(`A${currentRowNum}:G${currentRowNum}`);
      const jamiLabelCell = sheet.getCell(`A${currentRowNum}`);
      jamiLabelCell.value = 'Жами:';
      jamiLabelCell.font = { bold: true };
      jamiLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
      
      const jamiValueCell = sheet.getCell(`H${currentRowNum}`);
      jamiValueCell.value = carTotal;
      jamiValueCell.font = { bold: true };
      jamiValueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF2CC' }, // light yellow
      };
      jamiValueCell.numFmt = '#,##0.00';
      
      for (let i = 1; i <= 8; i++) {
        sheet.getCell(currentRowNum, i).border = borderAll;
      }
      
      grandTotal += carTotal;
      currentRowNum++;
    }

    // Har bir avto blokidan keyin bitta bo'sh qator
    currentRowNum++;
  }

  // 5. Fayl oxiri - Umumiy jami
  sheet.mergeCells(`A${currentRowNum}:G${currentRowNum}`);
  const grandTotalLabel = sheet.getCell(`A${currentRowNum}`);
  grandTotalLabel.value = 'Жами барча автомобиллар бўйича:';
  grandTotalLabel.font = { bold: true };
  grandTotalLabel.alignment = { horizontal: 'right', vertical: 'middle' };
  
  const grandTotalValue = sheet.getCell(`H${currentRowNum}`);
  grandTotalValue.value = grandTotal;
  grandTotalValue.font = { bold: true, size: 12 };
  grandTotalValue.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFC6E0B4' }, // light green
  };
  grandTotalValue.numFmt = '#,##0.00';
  
  for (let i = 1; i <= 8; i++) {
    sheet.getCell(currentRowNum, i).border = borderAll;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}
