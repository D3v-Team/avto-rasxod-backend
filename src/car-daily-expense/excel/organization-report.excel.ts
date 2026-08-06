import * as ExcelJS from 'exceljs';
import {
  buildHeaderRows,
  setColumnWidths,
  applyA4LandscapeSetup,
  styleDataCell,
  CYRILLIC_MONTHS,
  CAR_TITLE_FILL,
  JAMI_FILL,
  GRAND_FILL,
  MAX_FUELS_PER_SHEET,
  FuelRef,
} from './organization-report-common.excel';

export async function generateOrganizationReportWorkbook(
  reportData: any,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const year = reportData.year;
  const month = reportData.month;
  const monthName = CYRILLIC_MONTHS[month] || `${month}-ой`;
  const groups: any[] = Array.isArray(reportData.groups) ? reportData.groups : [];

  // Barcha yoqilg'i turlarini (dinamik) yig'ish
  const fuelMap = new Map<string, FuelRef>();
  groups.forEach((group) => {
    (group.cars || []).forEach((carItem: any) => {
      (carItem.fuels || []).forEach((f: any) => {
        if (!fuelMap.has(f.fuel_id)) {
          fuelMap.set(f.fuel_id, { id: f.fuel_id, name: f.fuel_name, unit: f.fuel_unit });
        }
      });
    });
  });
  const allFuels = Array.from(fuelMap.values());

  // Yoqilg'i turlarini MAX_FUELS_PER_SHEET bo'yicha bo'laklarga bo'lish —
  // har bir bo'lak ALOHIDA sheet'da chiqadi, A4 kengligiga sig'ishi uchun
  const fuelChunks: FuelRef[][] = [];
  for (let i = 0; i < allFuels.length; i += MAX_FUELS_PER_SHEET) {
    fuelChunks.push(allFuels.slice(i, i + MAX_FUELS_PER_SHEET));
  }
  if (fuelChunks.length === 0) fuelChunks.push([]);

  fuelChunks.forEach((fuelsForSheet, sheetIdx) => {
    const sheetName = fuelChunks.length > 1 ? `Хисобот ${sheetIdx + 1}` : 'Хисобот';
    const worksheet = workbook.addWorksheet(sheetName);

    const {
      totalCols,
      startBalanceCol,
      consumedStartCol,
      totalSumCol,
      endBalanceCol,
      holidayStartCol,
    } = buildHeaderRows(worksheet, year, monthName, fuelsForSheet);

    let currentRow = 4;
    let carNo = 1;

    groups.forEach((group) => {
      const cars: any[] = Array.isArray(group.cars) ? group.cars : [];
      if (cars.length === 0) return;

      const groupStartRow = currentRow;

      cars.forEach((carItem: any) => {
        const carName = carItem.car?.name || '—';
        const plateNumber = carItem.car?.plate_number || '—';

        // Avto nomi — sarlavha qator, 3-ustundan oxirigacha merge
        // (1 va 2-ustunlar bu qatorda BO'SH qoldiriladi, chunki 2-ustun
        // guruh darajasida vertikal merge qilinadi, 1-ustunga esa
        // ma'lumot qatorida raqam qo'yiladi)
        worksheet.mergeCells(currentRow, 3, currentRow, totalCols);
        const titleCell = worksheet.getCell(currentRow, 3);
        titleCell.value = `${carName} - ${plateNumber}`;
        styleDataCell(titleCell, { bold: true, fill: CAR_TITLE_FILL, align: 'center' });
        for (let c = 1; c <= 2; c++) {
          styleDataCell(worksheet.getCell(currentRow, c), { fill: CAR_TITLE_FILL });
        }
        worksheet.getRow(currentRow).height = 16;
        currentRow++;

        // Ma'lumot qatori
        const dataRow = worksheet.getRow(currentRow);
        dataRow.getCell(1).value = carNo;
        dataRow.getCell(3).value = Number(carItem.total_mileage) || 0;

        fuelsForSheet.forEach((fuel, i) => {
          const cf = (carItem.fuels || []).find((f: any) => f.fuel_id === fuel.id);
          dataRow.getCell(startBalanceCol + i).value = cf ? Number(cf.start_balance) || 0 : '';
          const receivedCol = consumedStartCol + i * 2;
          dataRow.getCell(receivedCol).value = cf ? Number(cf.received_amount) || 0 : '';
          dataRow.getCell(receivedCol + 1).value = cf ? Number(cf.received_sum) || 0 : '';
          dataRow.getCell(endBalanceCol + i).value = cf ? Number(cf.end_balance) || 0 : '';
        });

        const carReceivedSum = (carItem.fuels || []).reduce((acc: number, f: any) => acc + (Number(f.received_sum) || 0), 0);
        dataRow.getCell(totalSumCol).value = carReceivedSum;
        dataRow.getCell(holidayStartCol).value = Number(carItem.holiday?.km) || 0;
        dataRow.getCell(holidayStartCol + 1).value = Number(carItem.holiday?.amount) || 0;
        dataRow.getCell(holidayStartCol + 2).value = Number(carItem.holiday?.sum) || 0;

        for (let c = 1; c <= totalCols; c++) {
          styleDataCell(dataRow.getCell(c), {
            align: c === 1 ? 'center' : 'right',
          });
        }
        dataRow.height = 20;

        carNo++;
        currentRow++;
      });

      const groupEndRow = currentRow - 1;

      // Масъул ustuni — guruh boshidan Жami dan OLDINGI qatorgacha MERGE
      const emp = group.responsible_employee;
      const groupTitle = emp
        ? `${emp.role || "Мас'ул"}: ${emp.full_name}`
        : "Мас'ул бириктирилмаган";
      worksheet.mergeCells(groupStartRow, 2, groupEndRow, 2);
      const masulCell = worksheet.getCell(groupStartRow, 2);
      masulCell.value = groupTitle;
      styleDataCell(masulCell, { bold: true, align: 'left' });
      for (let r = groupStartRow; r <= groupEndRow; r++) {
        worksheet.getCell(r, 2).border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      }

      // Жами qatori — guruh darajasida, alohida
      const groupTotal = group.group_total || {};
      const jamiRow = worksheet.getRow(currentRow);
      jamiRow.getCell(2).value = 'Жами';
      jamiRow.getCell(3).value = Number(groupTotal.total_mileage) || 0;

      fuelsForSheet.forEach((fuel, i) => {
        const gf = (groupTotal.fuels || []).find((f: any) => f.fuel_id === fuel.id);
        // Qoldiqlar yig'indisi turli mashinalar orasida mantiqsiz — "—"
        jamiRow.getCell(startBalanceCol + i).value = '—';
        const consumedCol = consumedStartCol + i * 2;
        jamiRow.getCell(consumedCol).value = gf ? Number(gf.total_received_amount) || 0 : 0;
        jamiRow.getCell(consumedCol + 1).value = gf ? Number(gf.total_received_sum) || 0 : 0;
        jamiRow.getCell(endBalanceCol + i).value = '—';
      });

      const groupReceivedSum = (groupTotal.fuels || []).reduce((acc: number, f: any) => acc + (Number(f.total_received_sum) || 0), 0);
      jamiRow.getCell(totalSumCol).value = groupReceivedSum;
      jamiRow.getCell(holidayStartCol).value = Number(groupTotal.holiday?.km) || 0;
      jamiRow.getCell(holidayStartCol + 1).value = Number(groupTotal.holiday?.amount) || 0;
      jamiRow.getCell(holidayStartCol + 2).value = Number(groupTotal.holiday?.sum) || 0;

      for (let c = 1; c <= totalCols; c++) {
        styleDataCell(jamiRow.getCell(c), {
          bold: true,
          fill: JAMI_FILL,
          align: c === 2 ? 'center' : 'right',
        });
      }
      jamiRow.height = 20;
      currentRow++;
    });

    // ---- Умумий жами ----
    const grandTotal = reportData.grand_total || {};
    worksheet.mergeCells(currentRow, 1, currentRow, 2);
    const grandLabelCell = worksheet.getCell(currentRow, 1);
    grandLabelCell.value = 'Умумий жами';
    styleDataCell(grandLabelCell, { bold: true, fill: GRAND_FILL, align: 'center' });

    const grandRow = worksheet.getRow(currentRow);
    grandRow.getCell(3).value = Number(grandTotal.total_mileage) || 0;

    fuelsForSheet.forEach((fuel, i) => {
      const gf = (grandTotal.fuels || []).find((f: any) => f.fuel_id === fuel.id);
      grandRow.getCell(startBalanceCol + i).value = '—';
      const receivedCol = consumedStartCol + i * 2;
      grandRow.getCell(receivedCol).value = gf ? Number(gf.total_received_amount) || 0 : 0;
      grandRow.getCell(receivedCol + 1).value = gf ? Number(gf.total_received_sum) || 0 : 0;
      grandRow.getCell(endBalanceCol + i).value = '—';
    });

    const grandReceivedSum = (grandTotal.fuels || []).reduce((acc: number, f: any) => acc + (Number(f.total_received_sum) || 0), 0);
    grandRow.getCell(totalSumCol).value = grandReceivedSum;
    grandRow.getCell(holidayStartCol).value = Number(grandTotal.holiday?.km) || 0;
    grandRow.getCell(holidayStartCol + 1).value = Number(grandTotal.holiday?.amount) || 0;
    grandRow.getCell(holidayStartCol + 2).value = Number(grandTotal.holiday?.sum) || 0;

    for (let c = 3; c <= totalCols; c++) {
      styleDataCell(grandRow.getCell(c), { bold: true, fill: GRAND_FILL, align: 'right' });
    }
    grandRow.height = 22;

    setColumnWidths(worksheet, totalCols);
    applyA4LandscapeSetup(worksheet);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}