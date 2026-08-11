import * as ExcelJS from 'exceljs';
import {
  applyA4LandscapeSetup,
  buildHeaderRows,
  CAR_TITLE_FILL,
  CYRILLIC_MONTHS,
  FuelRef,
  GRAND_FILL,
  JAMI_FILL,
  MAX_FUELS_PER_SHEET,
  setColumnWidths,
  styleDataCell,
  THIN_BORDER,
} from './organization-report-common.excel';

export async function generateOrganizationReportWorkbook(
  reportData: any,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const year = reportData.year;
  const month = reportData.month;
  const monthName = CYRILLIC_MONTHS[month] || `${month}-ой`;
  const groups: any[] = Array.isArray(reportData.groups)
    ? reportData.groups
    : [];

  const allFuels: FuelRef[] = Array.isArray(reportData.all_fuels)
    ? reportData.all_fuels
    : [];

  const fuelChunks: FuelRef[][] = [];
  for (let i = 0; i < allFuels.length; i += MAX_FUELS_PER_SHEET) {
    fuelChunks.push(allFuels.slice(i, i + MAX_FUELS_PER_SHEET));
  }
  if (fuelChunks.length === 0) fuelChunks.push([]);

  fuelChunks.forEach((fuelsForSheet, sheetIdx) => {
    const sheetName =
      fuelChunks.length > 1 ? `Қисм ${sheetIdx + 1}` : 'Хисобот';
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

        worksheet.mergeCells(currentRow, 3, currentRow, totalCols);
        const titleCell = worksheet.getCell(currentRow, 3);
        titleCell.value = `${carName} - ${plateNumber}`;
        styleDataCell(titleCell, {
          bold: true,
          fill: CAR_TITLE_FILL,
          align: 'center',
        });
        for (let c = 1; c <= 2; c++) {
          styleDataCell(worksheet.getCell(currentRow, c), {
            fill: CAR_TITLE_FILL,
          });
        }
        worksheet.getRow(currentRow).height = 16;
        currentRow++;

        const holidayFuels = (carItem.holiday_fuels || []).filter(
          (hf: any) => hf.consumed_amount > 0 || hf.received_amount > 0,
        );
        const rowSpan = Math.max(1, holidayFuels.length);
        const dataStartRow = currentRow;
        const dataEndRow = currentRow + rowSpan - 1;

        const mergeAndStyle = (
          col: number,
          val: any,
          align: 'left' | 'center' | 'right',
        ) => {
          if (rowSpan > 1)
            worksheet.mergeCells(dataStartRow, col, dataEndRow, col);
          const cell = worksheet.getCell(dataStartRow, col);
          cell.value = val;
          styleDataCell(cell, { align });
          // Ensure borders for all merged cells
          for (let r = dataStartRow; r <= dataEndRow; r++)
            worksheet.getCell(r, col).border = THIN_BORDER;
        };

        mergeAndStyle(1, carNo, 'center');
        mergeAndStyle(3, Number(carItem.total_mileage) || 0, 'right');

        fuelsForSheet.forEach((fuel, i) => {
          const cf = (carItem.fuels || []).find(
            (f: any) => f.fuel_id === fuel.id,
          );
          mergeAndStyle(
            startBalanceCol + i,
            cf ? Number(cf.start_balance) || 0 : '',
            'right',
          );
          const receivedCol = consumedStartCol + i * 2;
          mergeAndStyle(
            receivedCol,
            cf ? Number(cf.received_amount) || 0 : '',
            'right',
          );
          mergeAndStyle(
            receivedCol + 1,
            cf ? Number(cf.received_sum) || 0 : '',
            'right',
          );
          mergeAndStyle(
            endBalanceCol + i,
            cf ? Number(cf.end_balance) || 0 : '',
            'right',
          );
        });

        const carReceivedSum = (carItem.fuels || []).reduce(
          (acc: number, f: any) => acc + (Number(f.received_sum) || 0),
          0,
        );
        mergeAndStyle(totalSumCol, carReceivedSum, 'right');

        for (let r = 0; r < rowSpan; r++) {
          const rowObj = worksheet.getRow(dataStartRow + r);
          rowObj.height = 20;

          const hf = holidayFuels[r];
          const fuelNameCell = worksheet.getCell(
            dataStartRow + r,
            holidayStartCol,
          );
          const kmCell = worksheet.getCell(
            dataStartRow + r,
            holidayStartCol + 1,
          );
          const amountCell = worksheet.getCell(
            dataStartRow + r,
            holidayStartCol + 2,
          );
          const sumCell = worksheet.getCell(
            dataStartRow + r,
            holidayStartCol + 3,
          );

          if (hf) {
            fuelNameCell.value = `${hf.fuel_name} ${hf.fuel_unit}`;
            kmCell.value = Number(hf.km) || 0;
            amountCell.value = Number(hf.consumed_amount) || 0;
            sumCell.value = Number(hf.consumed_sum) || 0;
          } else {
            fuelNameCell.value = '';
            kmCell.value = 0;
            amountCell.value = 0;
            sumCell.value = 0;
          }
          styleDataCell(fuelNameCell, { align: 'center' });
          styleDataCell(kmCell, { align: 'right' });
          styleDataCell(amountCell, { align: 'right' });
          styleDataCell(sumCell, { align: 'right' });
        }

        carNo++;
        currentRow = dataEndRow + 1;
      });

      const groupEndRow = currentRow - 1;

      const emp = group.responsible_employee;
      const groupTitle = emp
        ? `${emp.role || 'Масъул'}: ${emp.full_name}`
        : 'Масъул бириктирилмаган';
      worksheet.mergeCells(groupStartRow, 2, groupEndRow, 2);
      const masulCell = worksheet.getCell(groupStartRow, 2);
      masulCell.value = groupTitle;
      styleDataCell(masulCell, { bold: true, align: 'left' });
      for (let r = groupStartRow; r <= groupEndRow; r++) {
        worksheet.getCell(r, 2).border = THIN_BORDER;
      }

      const groupTotal = group.group_total || {};
      const groupHolidayFuels = (groupTotal.holiday_fuels || []).filter(
        (hf: any) =>
          hf.total_consumed_amount > 0 || hf.total_received_amount > 0,
      );
      const groupRowSpan = Math.max(1, groupHolidayFuels.length);
      const groupDataStartRow = currentRow;
      const groupDataEndRow = currentRow + groupRowSpan - 1;

      const mergeAndStyleGroup = (
        col: number,
        val: any,
        align: 'left' | 'center' | 'right',
      ) => {
        if (groupRowSpan > 1)
          worksheet.mergeCells(groupDataStartRow, col, groupDataEndRow, col);
        const cell = worksheet.getCell(groupDataStartRow, col);
        cell.value = val;
        styleDataCell(cell, { bold: true, fill: JAMI_FILL, align });
        for (let r = groupDataStartRow; r <= groupDataEndRow; r++) {
          const c = worksheet.getCell(r, col);
          c.border = THIN_BORDER;
          c.fill = JAMI_FILL;
        }
      };

      mergeAndStyleGroup(2, 'Жами', 'center');
      mergeAndStyleGroup(3, Number(groupTotal.total_mileage) || 0, 'right');

      fuelsForSheet.forEach((fuel, i) => {
        const gf = (groupTotal.fuels || []).find(
          (f: any) => f.fuel_id === fuel.id,
        );
        mergeAndStyleGroup(startBalanceCol + i, '—', 'right');
        const consumedCol = consumedStartCol + i * 2;
        mergeAndStyleGroup(
          consumedCol,
          gf ? Number(gf.total_received_amount) || 0 : 0,
          'right',
        );
        mergeAndStyleGroup(
          consumedCol + 1,
          gf ? Number(gf.total_received_sum) || 0 : 0,
          'right',
        );
        mergeAndStyleGroup(endBalanceCol + i, '—', 'right');
      });

      const groupReceivedSum = (groupTotal.fuels || []).reduce(
        (acc: number, f: any) => acc + (Number(f.total_received_sum) || 0),
        0,
      );
      mergeAndStyleGroup(totalSumCol, groupReceivedSum, 'right');

      for (let r = 0; r < groupRowSpan; r++) {
        const rowObj = worksheet.getRow(groupDataStartRow + r);
        rowObj.height = 20;

        const hf = groupHolidayFuels[r];
        const fuelNameCell = worksheet.getCell(
          groupDataStartRow + r,
          holidayStartCol,
        );
        const kmCell = worksheet.getCell(
          groupDataStartRow + r,
          holidayStartCol + 1,
        );
        const amountCell = worksheet.getCell(
          groupDataStartRow + r,
          holidayStartCol + 2,
        );
        const sumCell = worksheet.getCell(
          groupDataStartRow + r,
          holidayStartCol + 3,
        );

        if (hf) {
          fuelNameCell.value = `${hf.fuel_name} ${hf.fuel_unit}`;
          kmCell.value = Number(hf.total_km) || 0;
          amountCell.value = Number(hf.total_consumed_amount) || 0;
          sumCell.value = Number(hf.total_consumed_sum) || 0;
        } else {
          fuelNameCell.value = '';
          kmCell.value = 0;
          amountCell.value = 0;
          sumCell.value = 0;
        }
        styleDataCell(fuelNameCell, {
          bold: true,
          fill: JAMI_FILL,
          align: 'center',
        });
        styleDataCell(kmCell, { bold: true, fill: JAMI_FILL, align: 'right' });
        styleDataCell(amountCell, {
          bold: true,
          fill: JAMI_FILL,
          align: 'right',
        });
        styleDataCell(sumCell, { bold: true, fill: JAMI_FILL, align: 'right' });
      }

      currentRow = groupDataEndRow + 1;
    });

    const grandTotal = reportData.grand_total || {};
    const grandHolidayFuels = (grandTotal.holiday_fuels || []).filter(
      (hf: any) => hf.consumed_amount > 0 || hf.received_amount > 0,
    );
    const grandRowSpan = Math.max(1, grandHolidayFuels.length);
    const grandDataStartRow = currentRow;
    const grandDataEndRow = currentRow + grandRowSpan - 1;

    const mergeAndStyleGrand = (
      colStart: number,
      colEnd: number,
      val: any,
      align: 'left' | 'center' | 'right',
    ) => {
      worksheet.mergeCells(
        grandDataStartRow,
        colStart,
        grandDataEndRow,
        colEnd,
      );
      const cell = worksheet.getCell(grandDataStartRow, colStart);
      cell.value = val;
      styleDataCell(cell, { bold: true, fill: GRAND_FILL, align });
      for (let r = grandDataStartRow; r <= grandDataEndRow; r++) {
        for (let c = colStart; c <= colEnd; c++) {
          const cx = worksheet.getCell(r, c);
          cx.border = THIN_BORDER;
          cx.fill = GRAND_FILL;
        }
      }
    };

    mergeAndStyleGrand(1, 2, 'Умумий жами', 'center');
    mergeAndStyleGrand(3, 3, Number(grandTotal.total_mileage) || 0, 'right');

    fuelsForSheet.forEach((fuel, i) => {
      const gf = (grandTotal.fuels || []).find(
        (f: any) => f.fuel_id === fuel.id,
      );
      mergeAndStyleGrand(
        startBalanceCol + i,
        startBalanceCol + i,
        '—',
        'right',
      );
      const receivedCol = consumedStartCol + i * 2;
      mergeAndStyleGrand(
        receivedCol,
        receivedCol,
        gf ? Number(gf.total_received_amount) || 0 : 0,
        'right',
      );
      mergeAndStyleGrand(
        receivedCol + 1,
        receivedCol + 1,
        gf ? Number(gf.total_received_sum) || 0 : 0,
        'right',
      );
      mergeAndStyleGrand(endBalanceCol + i, endBalanceCol + i, '—', 'right');
    });

    const grandReceivedSum = (grandTotal.fuels || []).reduce(
      (acc: number, f: any) => acc + (Number(f.total_received_sum) || 0),
      0,
    );
    mergeAndStyleGrand(totalSumCol, totalSumCol, grandReceivedSum, 'right');

    for (let r = 0; r < grandRowSpan; r++) {
      const rowObj = worksheet.getRow(grandDataStartRow + r);
      rowObj.height = 22;

      const hf = grandHolidayFuels[r];
      const fuelNameCell = worksheet.getCell(
        grandDataStartRow + r,
        holidayStartCol,
      );
      const kmCell = worksheet.getCell(
        grandDataStartRow + r,
        holidayStartCol + 1,
      );
      const amountCell = worksheet.getCell(
        grandDataStartRow + r,
        holidayStartCol + 2,
      );
      const sumCell = worksheet.getCell(
        grandDataStartRow + r,
        holidayStartCol + 3,
      );

      if (hf) {
        fuelNameCell.value = `${hf.fuel_name} ${hf.fuel_unit}`;
        kmCell.value = Number(hf.km) || 0;
        amountCell.value = Number(hf.consumed_amount) || 0;
        sumCell.value = Number(hf.consumed_sum) || 0;
      } else {
        fuelNameCell.value = '';
        kmCell.value = 0;
        amountCell.value = 0;
        sumCell.value = 0;
      }
      styleDataCell(fuelNameCell, {
        bold: true,
        fill: GRAND_FILL,
        align: 'center',
      });
      styleDataCell(kmCell, { bold: true, fill: GRAND_FILL, align: 'right' });
      styleDataCell(amountCell, {
        bold: true,
        fill: GRAND_FILL,
        align: 'right',
      });
      styleDataCell(sumCell, { bold: true, fill: GRAND_FILL, align: 'right' });
    }

    setColumnWidths(worksheet, totalCols);
    applyA4LandscapeSetup(worksheet);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
