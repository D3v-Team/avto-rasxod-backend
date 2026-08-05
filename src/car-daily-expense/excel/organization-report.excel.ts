import * as ExcelJS from 'exceljs';
import { buildHeaderRows, formatDataRow, setColumnWidths, CYRILLIC_MONTHS, setupPageSettings } from './organization-report-common.excel';

// export async function generateOrganizationReportWorkbook(
//   reportData: any,
// ): Promise<Buffer> {
//   const workbook = new ExcelJS.Workbook();
//   const worksheet = workbook.addWorksheet('Хисобот');

//   // Page setup: A4 Landscape & Fit to 1 page wide
//   setupPageSettings(worksheet);

//   const year = reportData.year;
//   const month = reportData.month;
//   const monthName = CYRILLIC_MONTHS[month] || `${month}-ой`;

//   // Header shakllantirish (19 ustunli statik jadval)
//   const { totalCols } = buildHeaderRows(worksheet, year, monthName);

//   let currentRowIndex = 4;

//   if (Array.isArray(reportData.groups)) {
//     reportData.groups.forEach((group: any) => {
//       // 1. Group Header Row (Guruh sarlavhasi)
//       const groupHeaderRow = worksheet.getRow(currentRowIndex);
      
//       const emp = group.responsible_employee;
//       const groupTitle = emp ? `${emp.role || 'Масъул'}: ${emp.full_name}` : 'Масъул бириктирилмаган';
      
//       worksheet.mergeCells(currentRowIndex, 1, currentRowIndex, totalCols);
//       groupHeaderRow.getCell(1).value = groupTitle;
      
//       formatDataRow(groupHeaderRow, totalCols, false, true, 'FFB0C4DE'); // LightSteelBlue
//       currentRowIndex++;

//       // 2. Cars in Group (Avtomobillar)
//       if (Array.isArray(group.cars)) {
//         group.cars.forEach((carItem: any, index: number) => {
//           const row = worksheet.getRow(currentRowIndex);

//           // Benzin, Gaz va Propan uchun ma'lumotlarni ajratib olish
//           const benzin = carItem.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('benzin') || f.fuel_id === 'benzin');
//           const gaz = carItem.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('gaz') || f.fuel_id === 'gaz');
//           const propan = carItem.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('propan') || f.fuel_id === 'propan');

//           const drvName = carItem.car?.driver?.full_name || carItem.car?.responsible_employee?.full_name || '—';
//           const carName = carItem.car?.name || '';
//           const plateNumber = carItem.car?.plate_number || '';

//           // 1-ustun: №
//           row.getCell(1).value = index + 1;
          
//           // 2-ustun: Mas'ul / Haydovchi hamda Mashina nomi (bitta katakda)
//           row.getCell(2).value = `${carName} (${plateNumber})\nҲайдовчи: ${drvName}`;

//           // 3-ustun: Yurilgan masofa (Endi o'z o'rniga tushdi!)
//           row.getCell(3).value = Number(carItem.total_mileage) || 0;

//           // 4-6 ustunlar: Oy boshiga qoldiq (Benzin, Gaz, Propan)
//           row.getCell(4).value = Number(benzin?.start_balance) || 0;
//           row.getCell(5).value = Number(gaz?.start_balance) || 0;
//           row.getCell(6).value = Number(propan?.start_balance) || 0;

//           // 7-13 ustunlar: Oy davomida sarflangan
//           row.getCell(7).value = Number(benzin?.consumed_amount) || 0;
//           row.getCell(8).value = Number(benzin?.consumed_sum) || 0;
//           row.getCell(9).value = Number(gaz?.consumed_amount) || 0;
//           row.getCell(10).value = Number(gaz?.consumed_sum) || 0;
//           row.getCell(11).value = Number(propan?.consumed_amount) || 0;
//           row.getCell(12).value = Number(propan?.consumed_sum) || 0;
//           row.getCell(13).value = Number(carItem.total_sum) || 0; // Umumiy summa

//           // 14-16 ustunlar: Oy oxiriga qoldiq
//           row.getCell(14).value = Number(benzin?.end_balance) || 0;
//           row.getCell(15).value = Number(gaz?.end_balance) || 0;
//           row.getCell(16).value = Number(propan?.end_balance) || 0;

//           // 17-19 ustunlar: Dam olish kunlarida
//           row.getCell(17).value = Number(carItem.holiday?.km) || 0;
//           row.getCell(18).value = Number(carItem.holiday?.amount) || 0;
//           row.getCell(19).value = Number(carItem.holiday?.sum) || 0;

//           formatDataRow(row, totalCols, false, false);
//           currentRowIndex++;
//         });
//       }

//       // 3. Group Total (Guruh bo'yicha "Жами")
//       const groupTotal = group.group_total;
//       if (groupTotal) {
//         const groupTotalRow = worksheet.getRow(currentRowIndex);

//         const gtBenzin = groupTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('benzin') || f.fuel_id === 'benzin');
//         const gtGaz = groupTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('gaz') || f.fuel_id === 'gaz');
//         const gtPropan = groupTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('propan') || f.fuel_id === 'propan');

//         groupTotalRow.getCell(1).value = '';
//         groupTotalRow.getCell(2).value = 'Жами';
//         groupTotalRow.getCell(3).value = Number(groupTotal.total_mileage) || 0;

//         // Qoldiqlar yig'indisi chiqarilmaydi ("—")
//         groupTotalRow.getCell(4).value = '—';
//         groupTotalRow.getCell(5).value = '—';
//         groupTotalRow.getCell(6).value = '—';

//         // Sarflanganlar yig'indisi
//         groupTotalRow.getCell(7).value = Number(gtBenzin?.total_consumed_amount) || 0;
//         groupTotalRow.getCell(8).value = Number(gtBenzin?.total_consumed_sum) || 0;
//         groupTotalRow.getCell(9).value = Number(gtGaz?.total_consumed_amount) || 0;
//         groupTotalRow.getCell(10).value = Number(gtGaz?.total_consumed_sum) || 0;
//         groupTotalRow.getCell(11).value = Number(gtPropan?.total_consumed_amount) || 0;
//         groupTotalRow.getCell(12).value = Number(gtPropan?.total_consumed_sum) || 0;
//         groupTotalRow.getCell(13).value = Number(groupTotal.total_sum) || 0;

//         groupTotalRow.getCell(14).value = '—';
//         groupTotalRow.getCell(15).value = '—';
//         groupTotalRow.getCell(16).value = '—';

//         groupTotalRow.getCell(17).value = Number(groupTotal.holiday?.km) || 0;
//         groupTotalRow.getCell(18).value = Number(groupTotal.holiday?.amount) || 0;
//         groupTotalRow.getCell(19).value = Number(groupTotal.holiday?.sum) || 0;

//         formatDataRow(groupTotalRow, totalCols, true, false, 'FFF0F0F0');
//         currentRowIndex++;
//       }
//     });
//   }

//   // 4. Grand Total Row (Умумий жами)
//   const grandTotal = reportData.grand_total;
//   if (grandTotal) {
//     const summaryRow = worksheet.getRow(currentRowIndex);

//     const grandBenzin = grandTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('benzin') || f.fuel_id === 'benzin');
//     const grandGaz = grandTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('gaz') || f.fuel_id === 'gaz');
//     const grandPropan = grandTotal.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('propan') || f.fuel_id === 'propan');

//     summaryRow.getCell(1).value = '';
//     summaryRow.getCell(2).value = 'Умумий жами';
//     summaryRow.getCell(3).value = Number(grandTotal.total_mileage) || 0;

//     summaryRow.getCell(4).value = '—';
//     summaryRow.getCell(5).value = '—';
//     summaryRow.getCell(6).value = '—';

//     summaryRow.getCell(7).value = Number(grandBenzin?.total_consumed_amount) || 0;
//     summaryRow.getCell(8).value = Number(grandBenzin?.total_consumed_sum) || 0;
//     summaryRow.getCell(9).value = Number(grandGaz?.total_consumed_amount) || 0;
//     summaryRow.getCell(10).value = Number(grandGaz?.total_consumed_sum) || 0;
//     summaryRow.getCell(11).value = Number(grandPropan?.total_consumed_amount) || 0;
//     summaryRow.getCell(12).value = Number(grandPropan?.total_consumed_sum) || 0;
//     summaryRow.getCell(13).value = Number(grandTotal.total_sum) || 0;

//     summaryRow.getCell(14).value = '—';
//     summaryRow.getCell(15).value = '—';
//     summaryRow.getCell(16).value = '—';

//     summaryRow.getCell(17).value = Number(grandTotal.holiday?.km) || 0;
//     summaryRow.getCell(18).value = Number(grandTotal.holiday?.amount) || 0;
//     summaryRow.getCell(19).value = Number(grandTotal.holiday?.sum) || 0;

//     formatDataRow(summaryRow, totalCols, true, false, 'FFD3D3D3');
//     currentRowIndex += 2;
//   }

//   // 5. Imzolar bo'limi (Rasmdagi tag qismi)
//   worksheet.getRow(currentRowIndex).getCell(2).value = 'Раис';
//   worksheet.getRow(currentRowIndex).getCell(14).value = 'Р.Турсунмурадов';
//   worksheet.getRow(currentRowIndex).getCell(2).font = { name: 'Arial', size: 9, bold: true };
//   worksheet.getRow(currentRowIndex).getCell(14).font = { name: 'Arial', size: 9, bold: true };

//   currentRowIndex++;
//   worksheet.getRow(currentRowIndex).getCell(2).value = 'Бош ҳисобчи';
//   worksheet.getRow(currentRowIndex).getCell(14).value = 'И.Худойбердиев';
//   worksheet.getRow(currentRowIndex).getCell(2).font = { name: 'Arial', size: 9, bold: true };
//   worksheet.getRow(currentRowIndex).getCell(14).font = { name: 'Arial', size: 9, bold: true };

//   currentRowIndex++;
//   worksheet.getRow(currentRowIndex).getCell(2).value = 'Ишлар бошқарувчиси';
//   worksheet.getRow(currentRowIndex).getCell(14).value = 'С.Икрамов';
//   worksheet.getRow(currentRowIndex).getCell(2).font = { name: 'Arial', size: 9, bold: true };
//   worksheet.getRow(currentRowIndex).getCell(14).font = { name: 'Arial', size: 9, bold: true };

//   setColumnWidths(worksheet, totalCols);

//   const buffer = await workbook.xlsx.writeBuffer();
//   return Buffer.from(buffer);
// }
export async function generateOrganizationReportWorkbook(reportData: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Хисобот');

  setupPageSettings(worksheet);

  const year = reportData.year;
  const month = reportData.month;
  const monthName = CYRILLIC_MONTHS[month] || `${month}-ой`;

  const { totalCols } = buildHeaderRows(worksheet, year, monthName);
  let currentRowIndex = 4;
  let globalCarIdx = 1;

  if (Array.isArray(reportData.groups)) {
    reportData.groups.forEach((group: any, groupIdx: number) => {
      
      // 1. MASHINA MODELI (Guruh sarlavhasi sifatida butun qator bo'ylab)
      // Rasmdagi "Captiva - 20/226 TAA" kabi
      if (Array.isArray(group.cars)) {
        group.cars.forEach((carItem: any, carIdx: number) => {
          
          // Mashina nomi uchun alohida guruh sarlavhasi row'i (Rasmdagidek)
          const carHeaderRow = worksheet.getRow(currentRowIndex);
          const carName = carItem.car?.name || '';
          const plateNumber = carItem.car?.plate_number || '';
          
          worksheet.mergeCells(currentRowIndex, 1, currentRowIndex, totalCols);
          carHeaderRow.getCell(1).value = `${carName} - ${plateNumber}`;
          formatDataRow(carHeaderRow, totalCols, false, true, 'FFFAFAFA');
          currentRowIndex++;

          // Avto ma'lumotlari qatori
          const row = worksheet.getRow(currentRowIndex);

          const benzin = carItem.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('benzin') || f.fuel_id === 'benzin');
          const gaz = carItem.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('gaz') || f.fuel_id === 'gaz');
          const propan = carItem.fuels?.find((f: any) => f.fuel_name?.toLowerCase().includes('propan') || f.fuel_id === 'propan');

          const respName = carItem.car?.responsible_employee?.full_name || group.responsible_employee?.full_name || '';
          const respRole = carItem.car?.responsible_employee?.role || group.responsible_employee?.role || 'Масъул';
          const drvName = carItem.car?.driver?.full_name || '—';

          // 1-USTUN: №
          row.getCell(1).value = globalCarIdx++;

          // 2-USTUN: BIRIKTIRILGAN MAS'ULLAR (Rasmdagidek: Rais: ... \n Haydovchi: ...)
          let respStr = respName ? `${respRole}: ${respName}` : '';
          let drvStr = drvName !== '—' ? `Ҳайдовчи: ${drvName}` : '';
          row.getCell(2).value = [respStr, drvStr].filter(Boolean).join('\n') || '—';

          // 3-USTUN: YURILGAN MASOFA KM
          row.getCell(3).value = Number(carItem.total_mileage) || 0;

          // 4-6 USTUNLAR: Oy boshiga qoldiq
          row.getCell(4).value = Number(benzin?.start_balance) || 0;
          row.getCell(5).value = Number(gaz?.start_balance) || 0;
          row.getCell(6).value = Number(propan?.start_balance) || 0;

          // 7-13 USTUNLAR: Oy davomida sarflangan
          row.getCell(7).value = Number(benzin?.consumed_amount) || 0;
          row.getCell(8).value = Number(benzin?.consumed_sum) || 0;
          row.getCell(9).value = Number(gaz?.consumed_amount) || 0;
          row.getCell(10).value = Number(gaz?.consumed_sum) || 0;
          row.getCell(11).value = Number(propan?.consumed_amount) || 0;
          row.getCell(12).value = Number(propan?.consumed_sum) || 0;
          row.getCell(13).value = Number(carItem.total_sum) || 0;

          // 14-16 USTUNLAR: Oy oxiriga qoldiq
          row.getCell(14).value = Number(benzin?.end_balance) || 0;
          row.getCell(15).value = Number(gaz?.end_balance) || 0;
          row.getCell(16).value = Number(propan?.end_balance) || 0;

          // 17-19 USTUNLAR: Dam olish кунлари
          row.getCell(17).value = Number(carItem.holiday?.km) || 0;
          row.getCell(18).value = Number(carItem.holiday?.amount) || 0;
          row.getCell(19).value = Number(carItem.holiday?.sum) || 0;

          formatDataRow(row, totalCols, false, false);
          currentRowIndex++;
        });
      }

      // GURUH BO'YICHA JAMI (Жами qatori)
      const groupTotal = group.group_total;
      if (groupTotal) {
        const groupTotalRow = worksheet.getRow(currentRowIndex);
        groupTotalRow.getCell(2).value = 'Жами';
        groupTotalRow.getCell(3).value = Number(groupTotal.total_mileage) || 0;

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
        groupTotalRow.getCell(13).value = Number(groupTotal.total_sum) || 0;

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

  // GRAND TOTAL (Умумий жами)
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
    summaryRow.getCell(13).value = Number(grandTotal.total_sum) || 0;

    summaryRow.getCell(14).value = '—';
    summaryRow.getCell(15).value = '—';
    summaryRow.getCell(16).value = '—';

    summaryRow.getCell(17).value = Number(grandTotal.holiday?.km) || 0;
    summaryRow.getCell(18).value = Number(grandTotal.holiday?.amount) || 0;
    summaryRow.getCell(19).value = Number(grandTotal.holiday?.sum) || 0;

    formatDataRow(summaryRow, totalCols, true, false, 'FFD3D3D3');
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}