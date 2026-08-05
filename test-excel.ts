import { generateOrganizationReportWorkbook } from './src/car-daily-expense/excel/organization-report.excel';
import * as fs from 'fs';

async function test() {
  const dummyData = {
    year: 2026,
    month: 7,
    groups: [
      {
        responsible_employee: { full_name: 'Test Rais', role: 'Rais' },
        cars: [
          {
            car: { name: 'Captiva', plate_number: '20/226 TAA', driver: { full_name: 'Test Driver' } },
            total_mileage: 100,
            fuels: [
              { fuel_id: 'benzin', fuel_name: 'Benzin', start_balance: 10, consumed_amount: 5, consumed_sum: 50000, end_balance: 5 },
            ],
            total_sum: 50000,
            holiday: { km: 10, amount: 1, sum: 10000 }
          }
        ],
        group_total: {
          total_mileage: 100,
          total_sum: 50000,
          fuels: [
            { fuel_id: 'benzin', fuel_name: 'Benzin', total_consumed_amount: 5, total_consumed_sum: 50000 }
          ],
          holiday_km: 10,
          holiday_amount: 1,
          holiday_sum: 10000
        }
      }
    ],
    grand_total: {
      total_mileage: 100,
      total_sum: 50000,
      fuels: [
        { fuel_id: 'benzin', fuel_name: 'Benzin', total_consumed_amount: 5, total_consumed_sum: 50000 }
      ],
      holiday: { km: 10, amount: 1, sum: 10000 }
    }
  };

  try {
    const buf = await generateOrganizationReportWorkbook(dummyData);
    fs.writeFileSync('test_output.xlsx', buf);
    console.log('Success!');
  } catch (err) {
    console.error('Error generating:', err);
  }
}

test();
