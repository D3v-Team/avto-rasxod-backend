import * as ExcelJS from 'exceljs';
import { buildHeaderRows, formatDataRow, setColumnWidths, CYRILLIC_MONTHS } from './organization-report-common.excel';

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
  if (Array.isArray(reportData.groups)) {
    reportData.groups.forEach((group: any) => {
      if (Array.isArray(group.cars)) {
        group.cars.forEach((carItem: any) => {
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
    });
  }
  const fuels = Array.from(fuelMap.values());

  const { totalCols, totalSumCol, holidayStartCol } = buildHeaderRows(worksheet, year, monthName, fuels);

  let currentRowIndex = 4;
  if (Array.isArray(reportData.groups)) {
    reportData.groups.forEach((group: any) => {
      // 1. Group Header Row
      const groupHeaderRow = worksheet.getRow(currentRowIndex);
      groupHeaderRow.height = 30;
      
      const emp = group.responsible_employee;
      const groupTitle = emp ? `${emp.role || 'Масъул'}: ${emp.full_name}` : 'Масъул бириктирилмаган';
      
      worksheet.mergeCells(currentRowIndex, 1, currentRowIndex, totalCols);
      groupHeaderRow.getCell(1).value = groupTitle;
      
      formatDataRow(groupHeaderRow, totalCols, false, true, 'FFB0C4DE'); // LightSteelBlue for group header
      currentRowIndex++;

      // 2. Cars in Group
      if (Array.isArray(group.cars)) {
        group.cars.forEach((carItem: any, index: number) => {
          const row = worksheet.getRow(currentRowIndex);
          row.height = 35;

          row.getCell(1).value = index + 1;

          const respName = carItem.car?.responsible_employee?.full_name || '—';
          const drvName = carItem.car?.driver?.full_name || '—';
          const carName = carItem.car?.name || '—';
          const plateNumber = carItem.car?.plate_number || '—';

          row.getCell(2).value = `${carName}\n(${plateNumber})`;
          row.getCell(3).value = `Мас'ул: ${respName}\nХайдовчи: ${drvName}`;
          row.getCell(4).value = Number(carItem.total_mileage) || 0;

          let colIdx = 5; 
          fuels.forEach((fuel) => {
            const carFuel = carItem.fuels?.find((f: any) => f.fuel_id === fuel.id);
            row.getCell(colIdx).value = carFuel ? Number(carFuel.start_balance) || 0 : 0;
            row.getCell(colIdx + 1).value = carFuel ? Number(carFuel.consumed_amount) || 0 : 0;
            row.getCell(colIdx + 2).value = carFuel ? Number(carFuel.consumed_sum) || 0 : 0;
            row.getCell(colIdx + 3).value = carFuel ? Number(carFuel.end_balance) || 0 : 0;
            colIdx += 4;
          });

          row.getCell(totalSumCol).value = Number(carItem.total_sum) || 0;
          row.getCell(holidayStartCol).value = Number(carItem.holiday?.km) || 0;
          row.getCell(holidayStartCol + 1).value = Number(carItem.holiday?.amount) || 0;
          row.getCell(holidayStartCol + 2).value = Number(carItem.holiday?.sum) || 0;

          formatDataRow(row, totalCols, false, false);
          currentRowIndex++;
        });
      }

      // 3. Group Total (Жами)
      const groupTotal = group.group_total;
      if (groupTotal) {
        const groupTotalRow = worksheet.getRow(currentRowIndex);
        groupTotalRow.height = 30;

        groupTotalRow.getCell(1).value = '';
        groupTotalRow.getCell(2).value = 'Жами';
        groupTotalRow.getCell(3).value = '—';
        groupTotalRow.getCell(4).value = Number(groupTotal.total_mileage) || 0;

        let colIdx = 5;
        fuels.forEach((fuel) => {
          const gtFuel = groupTotal.fuels?.find((f: any) => f.fuel_id === fuel.id);
          groupTotalRow.getCell(colIdx).value = '—'; // Qoldiqlar yig'indisi mantiqsiz, "—" qo'yiladi
          groupTotalRow.getCell(colIdx + 1).value = gtFuel ? Number(gtFuel.total_consumed_amount) || 0 : 0;
          groupTotalRow.getCell(colIdx + 2).value = gtFuel ? Number(gtFuel.total_consumed_sum) || 0 : 0;
          groupTotalRow.getCell(colIdx + 3).value = '—'; // Qoldiqlar yig'indisi mantiqsiz, "—" qo'yiladi
          colIdx += 4;
        });

        groupTotalRow.getCell(totalSumCol).value = Number(groupTotal.total_sum) || 0;
        groupTotalRow.getCell(holidayStartCol).value = Number(groupTotal.holiday?.km) || 0;
        groupTotalRow.getCell(holidayStartCol + 1).value = Number(groupTotal.holiday?.amount) || 0;
        groupTotalRow.getCell(holidayStartCol + 2).value = Number(groupTotal.holiday?.sum) || 0;

        formatDataRow(groupTotalRow, totalCols, true, false, 'FFF0F0F0'); // Lighter gray for group total
        currentRowIndex++;
      }
    });
  }

  // Grand Total Row (Умумий жами)
  const grandTotal = reportData.grand_total;
  if (grandTotal) {
    const summaryRow = worksheet.getRow(currentRowIndex);
    summaryRow.height = 30;

    summaryRow.getCell(1).value = '';
    summaryRow.getCell(2).value = 'Умумий жами';
    summaryRow.getCell(3).value = '—';
    summaryRow.getCell(4).value = Number(grandTotal.total_mileage) || 0;

    let colIdx = 5;
    fuels.forEach((fuel) => {
      const gtFuel = grandTotal.fuels?.find((f: any) => f.fuel_id === fuel.id);
      summaryRow.getCell(colIdx).value = '—';
      summaryRow.getCell(colIdx + 1).value = gtFuel ? Number(gtFuel.total_consumed_amount) || 0 : 0;
      summaryRow.getCell(colIdx + 2).value = gtFuel ? Number(gtFuel.total_consumed_sum) || 0 : 0;
      summaryRow.getCell(colIdx + 3).value = '—';
      colIdx += 4;
    });

    summaryRow.getCell(totalSumCol).value = Number(grandTotal.total_sum) || 0;
    summaryRow.getCell(holidayStartCol).value = Number(grandTotal.holiday?.km) || 0;
    summaryRow.getCell(holidayStartCol + 1).value = Number(grandTotal.holiday?.amount) || 0;
    summaryRow.getCell(holidayStartCol + 2).value = Number(grandTotal.holiday?.sum) || 0;

    formatDataRow(summaryRow, totalCols, true, false, 'FFD3D3D3'); // Darker gray for grand total
  }

  setColumnWidths(worksheet, totalCols);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
