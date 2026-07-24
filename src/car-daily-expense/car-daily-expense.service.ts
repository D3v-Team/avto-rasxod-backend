import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { IncludeOptions, Op, WhereOptions, fn, col, literal } from 'sequelize';
import { Sequelize } from 'sequelize';
import { CarDailyExpense } from './models/car-daily-expense.model';
import { CarFuelNorm } from '../car-fuel-norm/models/car-fuel-norm.model';
import { CreateCarDailyExpenseDto } from './dto/create-car-daily-expense.dto';
import { UpdateCarDailyExpenseDto } from './dto/update-car-daily-expense.dto';
import { QueryCarDailyExpenseDto } from './dto/query-car-daily-expense.dto';
import { CarMonthlyReportQueryDto } from './dto/car-monthly-report-query.dto';
import { MonthlyStatisticsQueryDto } from './dto/monthly-statistics-query.dto';
import { YearlyStatisticsQueryDto } from './dto/yearly-statistics-query.dto';
import { OrganizationMonthlyReportQueryDto } from './dto/organization-monthly-report-query.dto';
import { OrganizationMonthlyReportExcelQueryDto } from './dto/organization-monthly-report-excel-query.dto';
import { CarMonthlyReportExcelQueryDto } from './dto/car-monthly-report-excel-query.dto';
import { generateOrganizationReportWorkbook } from './excel/organization-report.excel';
import { generateCarMonthlyReportWorkbook } from './excel/car-monthly-report.excel';
import { Car } from '../cars/models/cars.models';
import { Fuel } from '../fuels/models/fuels.models';
import { Employee } from '../employees/models/employee.model';
import { normalizeName } from '../common/utils/normalize-name.util';


// DIQQAT: CarDailyExpense modulida note (izoh) maydoni erkin matn bo'lgani sababli,
// uni majburan UPPERCASE qilish noqulaylik tug'diradi. Shu sababli note maydoniga
// normalizeName() QO'LLANILMAYDI (faqat GET search parametrida normalizeName ishlatiladi).

@Injectable()
export class CarDailyExpenseService {
  constructor(
    @InjectModel(CarDailyExpense)
    private readonly expenseRepo: typeof CarDailyExpense,
    @InjectModel(Car) private readonly carRepo: typeof Car,
    @InjectModel(Fuel) private readonly fuelRepo: typeof Fuel,
    @InjectModel(Employee) private readonly employeeRepo: typeof Employee,
    @InjectModel(CarFuelNorm)
    private readonly carFuelNormRepo: typeof CarFuelNorm,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) { }

  async create(dto: CreateCarDailyExpenseDto): Promise<CarDailyExpense> {
    try {
      const createdId = await this.sequelize.transaction(async (t) => {
        const car = await this.carRepo.findByPk(dto.car_id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!car) {
          throw new NotFoundException('Mashina topilmadi');
        }
        if (dto.date > new Date().toISOString().split('T')[0]) {
          throw new BadRequestException(
            "Kelgusi kunlar uchun ma'lumot kiritish mumkin emas",
          );
        }
        const lastRecord = await this.expenseRepo.findOne({
          where: { car_id: dto.car_id },
          order: [['sequence_no', 'DESC']],
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (lastRecord) {
          const newDate = new Date(dto.date);
          const lastDate = new Date(lastRecord.date);
          if (newDate < lastDate) {
            throw new BadRequestException(
              "Kiritilayotgan sana avvalgi kiritilgan sanadan kichik bo'lishi mumkin emas",
            );
          }
        }


        const carFuelNorm = await this.carFuelNormRepo.findOne({
          where: { car_id: dto.car_id, fuel_id: dto.fuel_id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!carFuelNorm) {
          throw new NotFoundException(
            "Bu mashina uchun shu yoqilg'i turida norma belgilanmagan",
          );
        }

        const existing = await this.expenseRepo.findOne({
          where: { car_id: dto.car_id, fuel_id: dto.fuel_id, date: dto.date },
          transaction: t,
        });
        if (existing) {
          throw new ConflictException(
            "Bu mashina va yoqilg'i turi uchun shu sana allaqachon kiritilgan",
          );
        }

        const fuel = await this.fuelRepo.findByPk(dto.fuel_id, {
          transaction: t,
        });
        if (!fuel) {
          throw new NotFoundException("Yoqilg'i turi topilmadi");
        }

        const odometer_start = car.speedometer;
        const odometer_end = dto.odometer_end;

        if (odometer_end < odometer_start) {
          throw new BadRequestException(
            "Kun oxiridagi spidometr qiymati joriy spidometrdan kichik bo'lishi mumkin emas",
          );
        }

        const mileage = odometer_end - odometer_start;
        const received_amount = dto.received_amount || 0;

        if (mileage === 0 && received_amount === 0) {
          throw new BadRequestException(
            "Kamida bittasi kiritilishi shart: yoqilg'i quyilgan miqdori " +
            "yoki bosib o'tilgan masofa. Ikkalasi ham 0 bo'lgan yozuv " +
            "yaratib bo'lmaydi",
          );
        }

        const fuel_expence = (mileage * carFuelNorm.norm_per_100km) / 100;
        const balance_after =
          carFuelNorm.current_balance + received_amount - fuel_expence;

        const nextSequenceNo = car.last_sequence_no + 1;

        const expense = await this.expenseRepo.create(
          {
            car_id: dto.car_id,
            fuel_id: dto.fuel_id,
            date: dto.date,
            sequence_no: nextSequenceNo,
            odometer_start,
            odometer_end,
            mileage,
            received_amount,
            fuel_expence,
            fuel_price_at_time: fuel.price, // ✅ Yaratilish paytidagi narx snapshoti
            balance_after,
            is_holiday: dto.is_holiday ?? false,
            note: dto.note,
          },
          { transaction: t },
        );

        await car.update(
          { speedometer: odometer_end, last_sequence_no: nextSequenceNo },
          { transaction: t },
        );
        await carFuelNorm.update(
          { current_balance: balance_after },
          { transaction: t },
        );

        return expense.id;
      });

      return this.findOne(createdId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarDailyExpense creation error:', error);
      throw new InternalServerErrorException(
        'Kunlik xarajat yaratishda xatolik yuz berdi',
      );
    }
  }

  async findAll(query: QueryCarDailyExpenseDto): Promise<{
    data: CarDailyExpense[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    totals: {
      fuel_id: string;
      fuel_name: string;
      fuel_unit: string;
      total_received_amount: number;
      total_fuel_expence: number;
      total_mileage: number;
      total_price_sum: number;
      current_balance: number;
    }[];
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        car_id,
        fuel_id,
        date_from,
        date_to,
        is_holiday,
        search,
        sortBy = 'date',
        sortOrder = 'DESC',
      } = query;
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const offset = (pageNum - 1) * limitNum;

      const where: WhereOptions<any> = {};

      if (car_id) {
        where.car_id = car_id;
      }

      if (fuel_id) {
        where.fuel_id = fuel_id;
      }

      if (date_from && date_to) {
        where.date = { [Op.between]: [date_from, date_to] };
      } else if (date_from) {
        where.date = { [Op.gte]: date_from };
      } else if (date_to) {
        where.date = { [Op.lte]: date_to };
      }

      if (is_holiday !== undefined) {
        where.is_holiday = is_holiday;
      }

      const include: IncludeOptions[] = [
        {
          model: Car,
          as: 'car',
          required: false,
        },
        {
          model: Fuel,
          as: 'fuel',
          required: false,
        },
      ];

      if (search) {
        const normalizedSearch = normalizeName(search);
        include[0].where = {
          [Op.or]: [
            { name: { [Op.iLike]: `%${normalizedSearch}%` } },
            { plate_number: { [Op.iLike]: `%${normalizedSearch}%` } },
          ],
        };
        include[0].required = true;
      }

      const order: [string, string][] = [];
      if (sortBy) {
        order.push([sortBy, sortOrder]);
        if (sortBy !== 'sequence_no') {
          order.push(['sequence_no', sortOrder]);
        }
      }

      const normalizedSearch = search ? normalizeName(search) : '';

      const [data, total, totalsRaw, fuelNormsRaw] = await Promise.all([
        this.expenseRepo.findAll({
          where,
          offset,
          limit: limitNum,
          order,
          include,
          subQuery: false,
        }),
        this.expenseRepo.count({ where, include, distinct: true }),
        // Filtrlarga mos BARCHA yozuvlar bo'yicha, fuel_id kesimida jami
        this.expenseRepo.findAll({
          where,
          include: [
            {
              model: Fuel,
              as: 'fuel',
              attributes: [],
              required: false,
            },
            ...(search
              ? [
                {
                  model: Car,
                  as: 'car',
                  attributes: [],
                  required: true,
                  where: {
                    [Op.or]: [
                      { name: { [Op.iLike]: `%${normalizedSearch}%` } },
                      { plate_number: { [Op.iLike]: `%${normalizedSearch}%` } },
                    ],
                  },
                },
              ]
              : []),
          ],
          attributes: [
            'fuel_id',
            [fn('MAX', col('fuel.name')), 'fuel_name'],
            [fn('MAX', col('fuel.unit')), 'fuel_unit'],
            [fn('SUM', col('CarDailyExpense.received_amount')), 'total_received_amount'],
            [fn('SUM', col('CarDailyExpense.fuel_expence')), 'total_fuel_expence'],
            [fn('SUM', col('CarDailyExpense.mileage')), 'total_mileage'],
            [
              literal(
                'SUM(COALESCE("CarDailyExpense"."received_amount", 0) * COALESCE("CarDailyExpense"."fuel_price_at_time", 0))',
              ),
              'total_price_sum',
            ],
          ],
          group: ['fuel_id'],
          raw: true,
          subQuery: false,
        }),
        this.carFuelNormRepo.findAll({
          where: car_id ? { car_id } : {},
          attributes: [
            'fuel_id',
            [fn('SUM', col('current_balance')), 'total_current_balance'],
          ],
          group: ['fuel_id'],
          raw: true,
        }),
      ]);

      const normBalanceMap = new Map<string, number>();
      (fuelNormsRaw as any[]).forEach((fnRow) => {
        normBalanceMap.set(
          fnRow.fuel_id,
          Number(fnRow.total_current_balance) || 0,
        );
      });

      const totals = (totalsRaw as any[]).map((row) => ({
        fuel_id: row.fuel_id,
        fuel_name: row.fuel_name || '',
        fuel_unit: row.fuel_unit || '',
        total_received_amount: Number(row.total_received_amount) || 0,
        total_fuel_expence: Number(row.total_fuel_expence) || 0,
        total_mileage: Number(row.total_mileage) || 0,
        total_price_sum: Number(row.total_price_sum) || 0,
        current_balance: normBalanceMap.get(row.fuel_id) ?? 0,
      }));

      const totalPages = Math.ceil(total / limitNum) || 0;

      return {
        data,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        totals,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarDailyExpense findAll error:', error);
      throw new InternalServerErrorException(
        'Kunlik xarajatlarni olishda xatolik yuz berdi',
      );
    }
  }

  async findOne(id: string): Promise<CarDailyExpense> {
    try {
      const expense = await this.expenseRepo.findByPk(id, {
        include: [
          {
            model: Car,
            as: 'car',
          },
          {
            model: Fuel,
            as: 'fuel',
          },
        ],
      });

      if (!expense) {
        throw new NotFoundException(`ID ${id} bo'yicha xarajat topilmadi`);
      }

      return expense;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarDailyExpense findOne error:', error);
      throw new InternalServerErrorException(
        'Kunlik xarajatni olishda xatolik yuz berdi',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateCarDailyExpenseDto,
  ): Promise<CarDailyExpense> {
    try {
      const updatedId = await this.sequelize.transaction(async (t) => {
        const record = await this.expenseRepo.findByPk(id, { transaction: t });
        if (!record) {
          throw new NotFoundException(`ID ${id} bo'yicha xarajat topilmadi`);
        }

        const lastRecord = await this.expenseRepo.findOne({
          where: { car_id: record.car_id },
          order: [['sequence_no', 'DESC']],
          transaction: t,
        });
        if (!lastRecord || lastRecord.id !== record.id) {
          throw new ForbiddenException(
            "Faqat shu mashina bo'yicha eng oxirgi yaratilgan rasxod yozuvini " +
            "(yoqilg'i turidan qat'i nazar) tahrirlash mumkin. Avvalgi " +
            'yozuvlar yopilgan hisoblanadi',
          );
        }

        const car = await this.carRepo.findByPk(record.car_id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        const carFuelNorm = await this.carFuelNormRepo.findOne({
          where: { car_id: record.car_id, fuel_id: record.fuel_id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        if (!carFuelNorm) {
          throw new NotFoundException(
            "Bu mashina uchun shu yoqilg'i turida norma belgilanmagan",
          );
        }

        const newOdometerEnd = dto.odometer_end ?? record.odometer_end;
        if (newOdometerEnd < record.odometer_start) {
          throw new BadRequestException(
            "Spidometr qiymati boshlang'ich qiymatdan kichik bo'lishi mumkin emas",
          );
        }
        const newMileage = newOdometerEnd - record.odometer_start;
        const newReceivedAmount = dto.received_amount ?? record.received_amount;

        if (newMileage === 0 && newReceivedAmount === 0) {
          throw new BadRequestException(
            "Kamida bittasi bo'lishi shart: yoqilg'i quyilgan miqdori " +
            "yoki bosib o'tilgan masofa. Ikkalasi ham 0 bo'lishi mumkin emas",
          );
        }

        const newFuelExpence = (newMileage * carFuelNorm.norm_per_100km) / 100;

        const previousRecord = await this.expenseRepo.findOne({
          where: {
            car_id: record.car_id,
            fuel_id: record.fuel_id,
            sequence_no: { [Op.lt]: record.sequence_no },
          },
          order: [['sequence_no', 'DESC']],
          transaction: t,
        });
        const previousBalance = previousRecord
          ? previousRecord.balance_after
          : 0;
        const newBalanceAfter =
          previousBalance + newReceivedAmount - newFuelExpence;

        await record.update(
          {
            odometer_end: newOdometerEnd,
            mileage: newMileage,
            received_amount: newReceivedAmount,
            fuel_expence: newFuelExpence,
            balance_after: newBalanceAfter,
            is_holiday: dto.is_holiday ?? record.is_holiday,
            note: dto.note ?? record.note,
          },
          { transaction: t },
        );

        await carFuelNorm.update(
          { current_balance: newBalanceAfter },
          { transaction: t },
        );

        if (newOdometerEnd !== record.odometer_end && car) {
          await car.update({ speedometer: newOdometerEnd }, { transaction: t });
        }

        return record.id;
      });

      return this.findOne(updatedId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarDailyExpense update error:', error);
      throw new InternalServerErrorException(
        'Kunlik xarajatni yangilashda xatolik yuz berdi',
      );
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      await this.sequelize.transaction(async (t) => {
        const record = await this.expenseRepo.findByPk(id, { transaction: t });
        if (!record) {
          throw new NotFoundException(`ID ${id} bo'yicha xarajat topilmadi`);
        }

        const lastRecord = await this.expenseRepo.findOne({
          where: { car_id: record.car_id },
          order: [['sequence_no', 'DESC']],
          transaction: t,
        });
        if (!lastRecord || lastRecord.id !== record.id) {
          throw new ForbiddenException(
            "Faqat shu mashina bo'yicha eng oxirgi yaratilgan rasxod yozuvini " +
            "o'chirish mumkin",
          );
        }

        const car = await this.carRepo.findByPk(record.car_id, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        const carFuelNorm = await this.carFuelNormRepo.findOne({
          where: { car_id: record.car_id, fuel_id: record.fuel_id },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        const previousRecord = await this.expenseRepo.findOne({
          where: {
            car_id: record.car_id,
            fuel_id: record.fuel_id,
            sequence_no: { [Op.lt]: record.sequence_no },
          },
          order: [['sequence_no', 'DESC']],
          transaction: t,
        });
        const previousBalance = previousRecord
          ? previousRecord.balance_after
          : 0;

        if (carFuelNorm) {
          await carFuelNorm.update(
            { current_balance: previousBalance },
            { transaction: t },
          );
        }

        if (car) {
          await car.update(
            {
              speedometer: record.odometer_start,
              last_sequence_no: record.sequence_no - 1,
            },
            { transaction: t },
          );
        }

        await record.destroy({ transaction: t });
      });

      return { message: "Kunlik xarajat muvaffaqiyatli o'chirildi" };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarDailyExpense remove error:', error);
      throw new InternalServerErrorException(
        "Kunlik xarajatni o'chirishda xatolik yuz berdi",
      );
    }
  }

  async getMonthlyReport(
    car_id: string,
    month: string,
  ): Promise<{
    fuel_reports: Array<{
      fuel_id: string;
      fuel: Fuel;
      total_mileage: number;
      total_received: number;
      total_fuel_expence: number;
      start_balance: number;
      end_balance: number;
    }>;
  }> {
    try {
      const [year, monthNum] = month.split('-');
      const startDate = `${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${month}-${lastDay.toString().padStart(2, '0')}`;

      const records = await this.expenseRepo.findAll({
        where: {
          car_id,
          date: { [Op.between]: [startDate, endDate] },
        },
        order: [
          ['fuel_id', 'ASC'],
          ['date', 'ASC'],
        ],
        include: [
          {
            model: Car,
            as: 'car',
          },
          {
            model: Fuel,
            as: 'fuel',
          },
        ],
      });

      if (records.length === 0) {
        throw new NotFoundException(
          `${month} oyi uchun xarajat yozuvlari topilmadi`,
        );
      }

      const groupedByFuel = records.reduce(
        (acc, record) => {
          if (!acc[record.fuel_id]) {
            acc[record.fuel_id] = {
              fuel_id: record.fuel_id,
              fuel: record.fuel,
              records: [] as CarDailyExpense[],
            };
          }
          acc[record.fuel_id].records.push(record);
          return acc;
        },
        {} as Record<
          string,
          { fuel_id: string; fuel: Fuel; records: CarDailyExpense[] }
        >,
      );

      const fuel_reports = Object.values(groupedByFuel).map((group) => {
        const fuelRecords = group.records;
        const total_mileage = fuelRecords.reduce(
          (sum, r) => sum + r.mileage,
          0,
        );
        const total_received = fuelRecords.reduce(
          (sum, r) => sum + r.received_amount,
          0,
        );
        const total_fuel_expence = fuelRecords.reduce(
          (sum, r) => sum + r.fuel_expence,
          0,
        );

        const firstRecord = fuelRecords[0];
        const start_balance =
          firstRecord.balance_after -
          firstRecord.received_amount +
          firstRecord.fuel_expence;
        const end_balance = fuelRecords[fuelRecords.length - 1].balance_after;

        return {
          fuel_id: group.fuel_id,
          fuel: group.fuel,
          total_mileage,
          total_received,
          total_fuel_expence,
          start_balance,
          end_balance,
        };
      });

      return { fuel_reports };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarDailyExpense getMonthlyReport error:', error);
      throw new InternalServerErrorException(
        'Oylik hisobotni olishda xatolik yuz berdi',
      );
    }
  }

  async getCarMonthlyReport(query: CarMonthlyReportQueryDto): Promise<{
    car: { id: string; name: string; plate_number: string };
    month: string;
    days: Array<{
      date: string;
      expenses: any[];
      odometer_start: number | null;
      odometer_end: number | null;
      mileage: number | null;
    }>;
    totals: Array<{
      fuel_id: string;
      fuel_name: string;
      fuel_unit: string;
      total_mileage: number;
      total_received_amount: number;
      total_fuel_expence: number;
    }>;
  }> {
    try {
      const car = await this.carRepo.findByPk(query.car_id);
      if (!car) {
        throw new NotFoundException('Mashina topilmadi');
      }

      const [year, monthNum] = query.month.split('-');
      const daysInMonth = new Date(
        parseInt(year),
        parseInt(monthNum),
        0,
      ).getDate();
      const startDate = `${query.month}-01`;
      const endDate = `${query.month}-${daysInMonth.toString().padStart(2, '0')}`;

      const where: WhereOptions = {
        car_id: query.car_id,
        date: { [Op.between]: [startDate, endDate] },
      };

      if (query.fuel_id) {
        where.fuel_id = query.fuel_id;
      }

      const records = await this.expenseRepo.findAll({
        where,
        order: [
          ['date', 'ASC'],
          ['sequence_no', 'ASC'],
        ],
        include: [
          {
            model: Fuel,
            as: 'fuel',
          },
        ],
      });

      const expensesByDate: Record<string, any[]> = {};
      records.forEach((record) => {
        if (!expensesByDate[record.date]) {
          expensesByDate[record.date] = [];
        }
        expensesByDate[record.date].push({
          id: record.id,
          fuel_id: record.fuel_id,
          fuel_name: record.fuel?.name,
          fuel_unit: record.fuel?.unit,
          mileage: record.mileage,
          received_amount: record.received_amount,
          fuel_expence: record.fuel_expence,
          balance_after: record.balance_after,
          is_holiday: record.is_holiday,
          note: record.note,
          odometer_start: record.odometer_start,
          odometer_end: record.odometer_end,
        });
      });

      const previousRecord = await this.expenseRepo.findOne({
        where: {
          car_id: query.car_id,
          date: { [Op.lt]: startDate },
        },
        order: [['sequence_no', 'DESC']],
      });
      const initialOdometer = previousRecord
        ? previousRecord.odometer_end
        : null;

      let runningOdometer = initialOdometer;

      const days: Array<{
        date: string;
        expenses: any[];
        odometer_start: number | null;
        odometer_end: number | null;
        mileage: number | null;
      }> = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${query.month}-${day.toString().padStart(2, '0')}`;
        const dayExpenses = expensesByDate[date] || [];

        if (dayExpenses.length > 0) {
          const firstExpenseForDay = dayExpenses[0]; // Saralangan ro'yxatdan eng birinchisi
          const lastExpenseForDay = dayExpenses[dayExpenses.length - 1]; // Eng oxirgisi
          const dailyMileage = dayExpenses.reduce((sum, e) => sum + (e.mileage || 0), 0);

          days.push({
            date,
            expenses: dayExpenses,
            odometer_start: firstExpenseForDay.odometer_start,
            odometer_end: lastExpenseForDay.odometer_end,
            mileage: dailyMileage,
          });
          runningOdometer = lastExpenseForDay.odometer_end;
        } else {
          if (runningOdometer !== null) {
            days.push({
              date,
              expenses: [],
              odometer_start: runningOdometer,
              odometer_end: runningOdometer,
              mileage: 0,
            });
          } else {
            days.push({
              date,
              expenses: [],
              odometer_start: null,
              odometer_end: null,
              mileage: null,
            });
          }
        }
      }

      const totalsByFuel: Record<
        string,
        {
          fuel_id: string;
          fuel_name: string;
          fuel_unit: string;
          total_mileage: number;
          total_received_amount: number;
          total_fuel_expence: number;
        }
      > = {};

      records.forEach((record) => {
        if (!totalsByFuel[record.fuel_id]) {
          totalsByFuel[record.fuel_id] = {
            fuel_id: record.fuel_id,
            fuel_name: record.fuel?.name || '',
            fuel_unit: record.fuel?.unit || '',
            total_mileage: 0,
            total_received_amount: 0,
            total_fuel_expence: 0,
          };
        }
        totalsByFuel[record.fuel_id].total_mileage += record.mileage;
        totalsByFuel[record.fuel_id].total_received_amount +=
          record.received_amount;
        totalsByFuel[record.fuel_id].total_fuel_expence += record.fuel_expence;
      });

      const totals = Object.values(totalsByFuel);

      return {
        car: {
          id: car.id,
          name: car.name,
          plate_number: car.plate_number,
        },
        month: query.month,
        days,
        totals,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarDailyExpense getCarMonthlyReport error:', error);
      throw new InternalServerErrorException(
        'Mashina oylik hisobotini olishda xatolik yuz berdi',
      );
    }
  }

  async getMonthlyStatistics(query: MonthlyStatisticsQueryDto): Promise<{
    month: string;
    cars: Array<{
      car: { id: string; name: string; plate_number: string };
      fuels: Array<{
        fuel_id: string;
        fuel_name: string;
        fuel_unit: string;
        total_mileage: number;
        total_received_amount: number;
        total_fuel_expence: number;
      }>;
    }>;
  }> {
    try {
      const [year, monthNum] = query.month.split('-');
      const daysInMonth = new Date(
        parseInt(year),
        parseInt(monthNum),
        0,
      ).getDate();
      const startDate = `${query.month}-01`;
      const endDate = `${query.month}-${daysInMonth.toString().padStart(2, '0')}`;

      const carWhere: WhereOptions = {};
      if (query.is_active !== undefined) {
        carWhere.is_active = query.is_active;
      }
      if (query.car_id) {
        carWhere.id = query.car_id;
      }

      const cars = await this.carRepo.findAll({
        where: carWhere,
      });

      const aggregated = (await this.expenseRepo.findAll({
        attributes: [
          'car_id',
          'fuel_id',
          [
            this.sequelize.fn('SUM', this.sequelize.col('mileage')),
            'total_mileage',
          ],
          [
            this.sequelize.fn('SUM', this.sequelize.col('received_amount')),
            'total_received_amount',
          ],
          [
            this.sequelize.fn('SUM', this.sequelize.col('fuel_expence')),
            'total_fuel_expence',
          ],
        ],
        where: {
          date: { [Op.between]: [startDate, endDate] },
        },
        group: ['car_id', 'fuel_id'],
        raw: true,
      })) as any[];

      const fuels = await this.fuelRepo.findAll();
      const fuelMap = new Map(fuels.map((f) => [f.id, f]));

      const aggregatedByCar: Record<
        string,
        Array<{
          fuel_id: string;
          fuel_name: string;
          fuel_unit: string;
          total_mileage: number;
          total_received_amount: number;
          total_fuel_expence: number;
        }>
      > = {};

      aggregated.forEach(
        (row: {
          car_id: string;
          fuel_id: string;
          total_mileage: string;
          total_received_amount: string;
          total_fuel_expence: string;
        }) => {
          const carId = row.car_id;
          if (!aggregatedByCar[carId]) {
            aggregatedByCar[carId] = [];
          }
          const fuel = fuelMap.get(row.fuel_id);
          aggregatedByCar[carId].push({
            fuel_id: row.fuel_id,
            fuel_name: fuel?.name || '',
            fuel_unit: fuel?.unit || '',
            total_mileage: Number(row.total_mileage) || 0,
            total_received_amount: Number(row.total_received_amount) || 0,
            total_fuel_expence: Number(row.total_fuel_expence) || 0,
          });
        },
      );

      const carsData = cars.map((car) => ({
        car: {
          id: car.id,
          name: car.name,
          plate_number: car.plate_number,
        },
        fuels: aggregatedByCar[car.id] || [],
      }));

      return {
        month: query.month,
        cars: carsData,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarDailyExpense getMonthlyStatistics error:', error);
      throw new InternalServerErrorException(
        'Oylik statistikani olishda xatolik yuz berdi',
      );
    }
  }

  async getYearlyStatistics(query: YearlyStatisticsQueryDto) {
    try {
      const { year, car_id, is_active } = query;
      const date_from = `${year}-01-01`;
      const date_to = `${year}-12-31`;

      const carWhere: any = {};
      if (car_id) carWhere.id = car_id;
      if (is_active !== undefined) carWhere.is_active = is_active;

      const cars = await this.carRepo.findAll({
        where: carWhere,
        attributes: ['id', 'name', 'plate_number'],
      });

      const fuels = await this.fuelRepo.findAll();

      const expenses = (await this.expenseRepo.findAll({
        where: {
          ...(car_id ? { car_id } : {}),
          date: { [Op.between]: [date_from, date_to] },
        },
        attributes: [
          'car_id',
          'fuel_id',
          [fn('EXTRACT', literal('MONTH FROM "date"')), 'month'],
          [fn('SUM', col('mileage')), 'total_mileage'],
          [fn('SUM', col('received_amount')), 'total_received_amount'],
          [fn('SUM', col('fuel_expence')), 'total_fuel_expence'],
          [
            literal(
              'SUM(COALESCE("received_amount", 0) * COALESCE("fuel_price_at_time", 0))',
            ),
            'total_received_price',
          ],
        ],
        group: [
          'car_id',
          'fuel_id',
          literal('EXTRACT(MONTH FROM "date")') as any,
        ],
        raw: true,
      })) as any[];

      const expensesMap = new Map<string, any[]>();
      for (const e of expenses) {
        const key = `${e.car_id}_${e.fuel_id}`;
        if (!expensesMap.has(key)) expensesMap.set(key, []);
        expensesMap.get(key)!.push(e);
      }

      const carsResult = cars.map((car) => {
        const carFuelsResult: any[] = [];

        for (const fuel of fuels) {
          const key = `${car.id}_${fuel.id}`;
          const fuelExpenses = expensesMap.get(key) || [];

          if (fuelExpenses.length === 0) {
            continue;
          }

          let yearly_total_mileage = 0;
          let yearly_total_received = 0;
          let yearly_total_expence = 0;
          let yearly_total_price = 0;

          const monthly_breakdown = Array.from({ length: 12 }, (_, i) => {
            const monthNum = i + 1;
            const monthRecord = fuelExpenses.find(
              (r) => Number(r.month) === monthNum,
            );

            const m_mileage = monthRecord ? Number(monthRecord.total_mileage) : 0;
            const m_received = monthRecord
              ? Number(monthRecord.total_received_amount)
              : 0;
            const m_expence = monthRecord
              ? Number(monthRecord.total_fuel_expence)
              : 0;
            // ✅ Fuel.price o'rniga yozuv yaratilgan paytdagi fuel_price_at_time yig'indisi ishlatiladi
            const m_reaceved_price = monthRecord
              ? Number(monthRecord.total_received_price) || 0
              : 0;

            yearly_total_mileage += m_mileage;
            yearly_total_received += m_received;
            yearly_total_expence += m_expence;
            yearly_total_price += m_reaceved_price;

            return {
              month: monthNum,
              total_mileage: m_mileage,
              total_received_amount: m_received,
              total_fuel_expence: m_expence,
              total_reaceved_price: m_reaceved_price,
            };
          });

          carFuelsResult.push({
            fuel_id: fuel.id,
            fuel_name: fuel.name,
            fuel_unit: fuel.unit,
            yearly_total: {
              total_mileage: yearly_total_mileage,
              total_received_amount: yearly_total_received,
              total_fuel_expence: yearly_total_expence,
              total_reaceved_price: yearly_total_price,
            },
            monthly_breakdown,
          });
        }

        return {
          car: {
            id: car.id,
            name: car.name,
            plate_number: car.plate_number,
          },
          fuels: carFuelsResult,
        };
      });

      return {
        year,
        cars: carsResult,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('getYearlyStatistics error:', error);
      throw new InternalServerErrorException(
        'Yillik statistikani olishda xatolik yuz berdi',
      );
    }
  }

  async allEmployesAndCarsCount() {
    const [totalEmployees, totalCars] = await Promise.all([
      this.employeeRepo.count({
        where: {
          is_deleted: false,
        },
        group: ['role'],
      }),
      this.carRepo.count({
        where: {
          is_deleted: false,
        },
      }),
    ]);
    return { totalEmployees, totalCars };
  }

  private async collectOrganizationMonthlyData(
    query: { year: number; month: number; is_active?: boolean; search?: string },
    options: { paginate: boolean; page?: number; limit?: number },
  ) {
    const year = Number(query.year);
    const month = Number(query.month);
    const paginate = options.paginate;
    const page = Math.max(Number(options.page) || 1, 1);
    const limit = Math.max(Number(options.limit) || 10, 1);
    const offset = (page - 1) * limit;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const carWhere: any = {};
    if (query.is_active !== undefined) {
      carWhere.is_active = query.is_active;
    }
    if (query.search) {
      const normalizedSearch = normalizeName(query.search);
      carWhere[Op.or] = [
        { name: { [Op.iLike]: `%${normalizedSearch}%` } },
        { plate_number: { [Op.iLike]: `%${normalizedSearch}%` } },
      ];
    }

    const [total, selectedCars] = await Promise.all([
      this.carRepo.count({ where: carWhere }),
      this.carRepo.findAll({
        where: carWhere,
        ...(paginate ? { offset, limit } : {}),
        order: [['name', 'ASC']],
        include: [
          {
            model: Employee,
            as: 'responsible_employee',
            attributes: ['id', 'full_name', 'phone', 'role'],
            required: false,
          },
          {
            model: Employee,
            as: 'driver',
            attributes: ['id', 'full_name', 'phone', 'role'],
            required: false,
          },
        ],
      }),
    ]);

    const carIds = selectedCars.map((c) => c.id);

    const fuelsList = await this.fuelRepo.findAll();
    const fuelMap = new Map<string, Fuel>();
    fuelsList.forEach((f) => fuelMap.set(f.id, f));

    let carsData: any[] = [];

    if (carIds.length > 0) {
      const expenses = await this.expenseRepo.findAll({
        where: {
          car_id: carIds,
          date: { [Op.between]: [startDate, endDate] },
        },
        order: [
          ['car_id', 'ASC'],
          ['fuel_id', 'ASC'],
          ['date', 'ASC'],
          ['sequence_no', 'ASC'],
        ],
      });

      const expensesByCarAndFuel = new Map<
        string,
        Map<string, CarDailyExpense[]>
      >();
      const holidayByCar = new Map<
        string,
        { km: number; amount: number; sum: number }
      >();

      expenses.forEach((exp) => {
        if (!expensesByCarAndFuel.has(exp.car_id)) {
          expensesByCarAndFuel.set(exp.car_id, new Map());
        }
        const fuelGroup = expensesByCarAndFuel.get(exp.car_id)!;
        if (!fuelGroup.has(exp.fuel_id)) {
          fuelGroup.set(exp.fuel_id, []);
        }
        fuelGroup.get(exp.fuel_id)!.push(exp);

        if (exp.is_holiday) {
          if (!holidayByCar.has(exp.car_id)) {
            holidayByCar.set(exp.car_id, { km: 0, amount: 0, sum: 0 });
          }
          const h = holidayByCar.get(exp.car_id)!;
          // ✅ Fuel.price o'rniga yozuv yaratilgan paytdagi fuel_price_at_time ishlatiladi
          const price = Number(exp.fuel_price_at_time) || fuelMap.get(exp.fuel_id)?.price || 0;
          h.km += Number(exp.mileage) || 0;
          h.amount += Number(exp.fuel_expence) || 0;
          h.sum += (Number(exp.fuel_expence) || 0) * price;
        }
      });

      carsData = selectedCars.map((car) => {
        const fuelGroup = expensesByCarAndFuel.get(car.id);
        const carHoliday = holidayByCar.get(car.id) || {
          km: 0,
          amount: 0,
          sum: 0,
        };

        let carTotalMileage = 0;
        let carTotalSum = 0;
        const fuelsResult: any[] = [];

        if (fuelGroup) {
          fuelGroup.forEach((records, fuelId) => {
            const fuel = fuelMap.get(fuelId);

            let consumedAmount = 0;
            let consumedSum = 0;
            records.forEach((r) => {
              const rAmount = Number(r.fuel_expence) || 0;
              // ✅ Har bir yozuvning saqlangan fuel_price_at_time narxi bo'yicha ko'paytiriladi
              const rPrice = Number(r.fuel_price_at_time) || fuel?.price || 0;
              carTotalMileage += Number(r.mileage) || 0;
              consumedAmount += rAmount;
              consumedSum += rAmount * rPrice;
            });

            carTotalSum += consumedSum;

            const firstRec = records[0];
            const lastRec = records[records.length - 1];

            const startBalance =
              Number(firstRec.balance_after) -
              Number(firstRec.received_amount) +
              Number(firstRec.fuel_expence);

            const endBalance = Number(lastRec.balance_after) || 0;

            fuelsResult.push({
              fuel_id: fuelId,
              fuel_name: fuel?.name || '',
              fuel_unit: fuel?.unit || '',
              start_balance: startBalance,
              consumed_amount: consumedAmount,
              consumed_sum: consumedSum,
              end_balance: endBalance,
            });
          });
        }

        return {
          car: {
            id: car.id,
            name: car.name,
            plate_number: car.plate_number,
            responsible_employee: car.responsible_employee
              ? { full_name: car.responsible_employee.full_name }
              : null,
            driver: car.driver ? { full_name: car.driver.full_name } : null,
          },
          total_mileage: carTotalMileage,
          fuels: fuelsResult,
          total_sum: carTotalSum,
          holiday: {
            km: carHoliday.km,
            amount: carHoliday.amount,
            sum: carHoliday.sum,
          },
        };
      });
    }

    const allMatchingCarIds = (
      await this.carRepo.findAll({
        where: carWhere,
        attributes: ['id'],
        raw: true,
      })
    ).map((c: any) => c.id);

    let grandTotalMileage = 0;
    let grandTotalSum = 0;
    const grandTotalFuelsMap = new Map<
      string,
      { amount: number; sum: number }
    >();
    const grandTotalHoliday = { km: 0, amount: 0, sum: 0 };

    if (allMatchingCarIds.length > 0) {
      const [grandTotalAgg, grandTotalFuelsAgg, grandTotalHolidayAgg] =
        await Promise.all([
          this.expenseRepo.findAll({
            where: {
              car_id: allMatchingCarIds,
              date: { [Op.between]: [startDate, endDate] },
            },
            attributes: [[fn('SUM', col('mileage')), 'total_mileage']],
            raw: true,
          }),
          this.expenseRepo.findAll({
            where: {
              car_id: allMatchingCarIds,
              date: { [Op.between]: [startDate, endDate] },
            },
            attributes: [
              'fuel_id',
              [fn('SUM', col('fuel_expence')), 'total_consumed_amount'],
              [
                literal(
                  'SUM(COALESCE("fuel_expence", 0) * COALESCE("fuel_price_at_time", 0))',
                ),
                'total_consumed_sum',
              ],
            ],
            group: ['fuel_id'],
            raw: true,
          }),
          this.expenseRepo.findAll({
            where: {
              car_id: allMatchingCarIds,
              date: { [Op.between]: [startDate, endDate] },
              is_holiday: true,
            },
            attributes: [
              'fuel_id',
              [fn('SUM', col('mileage')), 'km'],
              [fn('SUM', col('fuel_expence')), 'amount'],
              [
                literal(
                  'SUM(COALESCE("fuel_expence", 0) * COALESCE("fuel_price_at_time", 0))',
                ),
                'sum',
              ],
            ],
            group: ['fuel_id'],
            raw: true,
          }),
        ]);

      grandTotalMileage = Number((grandTotalAgg[0] as any)?.total_mileage) || 0;

      (grandTotalFuelsAgg as any[]).forEach((row) => {
        const amount = Number(row.total_consumed_amount) || 0;
        const sum = Number(row.total_consumed_sum) || 0;
        grandTotalFuelsMap.set(row.fuel_id, { amount, sum });
        grandTotalSum += sum;
      });

      (grandTotalHolidayAgg as any[]).forEach((row) => {
        const km = Number(row.km) || 0;
        const amount = Number(row.amount) || 0;
        const sum = Number(row.sum) || 0;
        grandTotalHoliday.km += km;
        grandTotalHoliday.amount += amount;
        grandTotalHoliday.sum += sum;
      });
    }

    const grandTotalFuels = Array.from(grandTotalFuelsMap.entries()).map(
      ([fuelId, val]) => {
        const fuel = fuelMap.get(fuelId);
        return {
          fuel_id: fuelId,
          fuel_name: fuel?.name || '',
          fuel_unit: fuel?.unit || '',
          total_consumed_amount: val.amount,
          total_consumed_sum: val.sum,
        };
      },
    );

    const totalPages = paginate ? Math.ceil(total / limit) || 0 : 1;

    return {
      year,
      month,
      page: paginate ? page : 1,
      limit: paginate ? limit : total,
      total,
      totalPages,
      data: carsData,
      grand_total: {
        total_mileage: grandTotalMileage,
        fuels: grandTotalFuels,
        total_sum: grandTotalSum,
        holiday: grandTotalHoliday,
      },
    };
  }

  private groupByResponsibleEmployee(carsFlatData: any[]) {
    const groupsMap = new Map<string, any>();
    const unassignedGroupKey = 'unassigned';

    carsFlatData.forEach((carItem: any) => {
      const emp = carItem.car?.responsible_employee;
      const key = emp ? emp.id : unassignedGroupKey;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          responsible_employee: emp || null,
          cars: [],
          group_total: {
            total_mileage: 0,
            fuelsMap: new Map<string, any>(),
            total_sum: 0,
            holiday: { km: 0, amount: 0, sum: 0 },
          },
        });
      }

      const group = groupsMap.get(key);
      group.cars.push(carItem);

      group.group_total.total_mileage += (Number(carItem.total_mileage) || 0);
      group.group_total.total_sum += (Number(carItem.total_sum) || 0);

      group.group_total.holiday.km += (Number(carItem.holiday?.km) || 0);
      group.group_total.holiday.amount += (Number(carItem.holiday?.amount) || 0);
      group.group_total.holiday.sum += (Number(carItem.holiday?.sum) || 0);

      if (Array.isArray(carItem.fuels)) {
        carItem.fuels.forEach((f: any) => {
          if (!group.group_total.fuelsMap.has(f.fuel_id)) {
            group.group_total.fuelsMap.set(f.fuel_id, {
              fuel_id: f.fuel_id,
              fuel_name: f.fuel_name,
              fuel_unit: f.fuel_unit,
              total_consumed_amount: 0,
              total_consumed_sum: 0,
            });
          }
          const gf = group.group_total.fuelsMap.get(f.fuel_id);
          gf.total_consumed_amount += (Number(f.consumed_amount) || 0);
          gf.total_consumed_sum += (Number(f.consumed_sum) || 0);
        });
      }
    });

    const groups = Array.from(groupsMap.values()).map(g => ({
      responsible_employee: g.responsible_employee,
      cars: g.cars,
      group_total: {
        total_mileage: g.group_total.total_mileage,
        fuels: Array.from(g.group_total.fuelsMap.values()),
        total_sum: g.group_total.total_sum,
        holiday: g.group_total.holiday,
      }
    }));

    // Sorting groups (optional but good for consistency), e.g. unassigned last or alphabetical
    groups.sort((a, b) => {
      if (!a.responsible_employee) return 1;
      if (!b.responsible_employee) return -1;
      return (a.responsible_employee.full_name || '').localeCompare(b.responsible_employee.full_name || '');
    });

    return groups;
  }

  async getOrganizationMonthlyReport(
    query: OrganizationMonthlyReportQueryDto,
  ) {
    try {
      const flatDataResult = await this.collectOrganizationMonthlyData(query, {
        paginate: true,
        page: query.page,
        limit: query.limit,
      });

      const groups = this.groupByResponsibleEmployee(flatDataResult.data);

      return {
        year: flatDataResult.year,
        month: flatDataResult.month,
        page: flatDataResult.page,
        limit: flatDataResult.limit,
        total: flatDataResult.total,
        totalPages: flatDataResult.totalPages,
        groups, // data o'rniga groups qaytariladi
        grand_total: flatDataResult.grand_total,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('getOrganizationMonthlyReport error:', error);
      throw new InternalServerErrorException(
        'Tashkilot oylik hisobotini olishda xatolik yuz berdi',
      );
    }
  }

  async generateOrganizationMonthlyReportExcel(
    query: OrganizationMonthlyReportExcelQueryDto,
  ): Promise<Buffer> {
    try {
      const flatDataResult = await this.collectOrganizationMonthlyData(query, {
        paginate: false, // Excel uchun barcha ma'lumotlar olinadi
      });

      const groups = this.groupByResponsibleEmployee(flatDataResult.data);

      const reportData = {
        year: flatDataResult.year,
        month: flatDataResult.month,
        groups,
        grand_total: flatDataResult.grand_total,
      };

      return await generateOrganizationReportWorkbook(reportData);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('generateOrganizationMonthlyReportExcel error:', error);
      throw new InternalServerErrorException(
        'Tashkilot Excel hisobotini generatsiya qilishda xatolik yuz berdi',
      );
    }
  }

  async generateCarMonthlyReportExcel(
    query: CarMonthlyReportExcelQueryDto,
  ): Promise<Buffer> {
    try {
      const { car_id, fuel_id, year, month } = query;

      const car = await this.carRepo.findByPk(car_id);
      if (!car) {
        throw new NotFoundException('Mashina topilmadi');
      }

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const daysInMonth = new Date(year, month, 0).getDate();
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

      const whereClause: any = {
        car_id,
        date: { [Op.between]: [startDate, endDate] },
      };

      if (fuel_id) {
        const selectedFuel = await this.fuelRepo.findByPk(fuel_id);
        if (!selectedFuel) {
          throw new NotFoundException("Yoqilg'i turi topilmadi");
        }
        whereClause.fuel_id = fuel_id;
      }

      const records = await this.expenseRepo.findAll({
        where: whereClause,
        include: [{ model: Fuel, as: 'fuel' }],
        order: [
          ['date', 'ASC'],
          ['sequence_no', 'ASC'],
        ],
      });

      // Distinct fuels to display
      let fuelsToDisplay: Fuel[] = [];
      if (fuel_id) {
        const selectedFuel = await this.fuelRepo.findByPk(fuel_id);
        if (selectedFuel) {
          fuelsToDisplay = [selectedFuel];
        }
      } else {
        const fuelIdsSet = new Set<string>();
        records.forEach((r) => fuelIdsSet.add(r.fuel_id));

        const norms = await this.carFuelNormRepo.findAll({
          where: { car_id },
          include: [{ model: Fuel, as: 'fuel' }],
        });
        norms.forEach((n) => fuelIdsSet.add(n.fuel_id));

        if (fuelIdsSet.size > 0) {
          fuelsToDisplay = await this.fuelRepo.findAll({
            where: { id: Array.from(fuelIdsSet) },
          });
        }
      }

      // Calculate start & end balance per fuel
      const summaryByFuel: Record<
        string,
        {
          start_balance: number;
          total_received: number;
          total_expence: number;
          end_balance: number;
          total_received_price: number;
        }
      > = {};

      for (const fuel of fuelsToDisplay) {
        const fuelRecords = records.filter((r) => r.fuel_id === fuel.id);
        let startBalance = 0;
        let endBalance = 0;
        let totalReceived = 0;
        let totalExpence = 0;

        if (fuelRecords.length > 0) {
          const firstRec = fuelRecords[0];
          const lastRec = fuelRecords[fuelRecords.length - 1];

          startBalance =
            Number(firstRec.balance_after) -
            Number(firstRec.received_amount) +
            Number(firstRec.fuel_expence);
          endBalance = Number(lastRec.balance_after) || 0;

          fuelRecords.forEach((r) => {
            totalReceived += Number(r.received_amount) || 0;
            totalExpence += Number(r.fuel_expence) || 0;
          });
        } else {
          const norm = await this.carFuelNormRepo.findOne({
            where: { car_id, fuel_id: fuel.id },
          });
          startBalance = norm ? Number(norm.current_balance) || 0 : 0;
          endBalance = startBalance;
        }

        summaryByFuel[fuel.id] = {
          start_balance: startBalance,
          total_received: totalReceived,
          total_expence: totalExpence,
          end_balance: endBalance,
          total_received_price: 0, // Calculate this below
        };
      }

      // Calculate total_received_price properly based on fuel_price_at_time
      for (const fuel of fuelsToDisplay) {
        let fuelReceivedPrice = 0;
        const fuelRecords = records.filter((r) => r.fuel_id === fuel.id);
        fuelRecords.forEach((r) => {
          const rReceived = Number(r.received_amount) || 0;
          const rPrice = Number(r.fuel_price_at_time) || fuel.price || 0; // ✅ Yozuv yaratilgan paytdagi narx ishlatiladi
          fuelReceivedPrice += (rReceived * rPrice);
        });
        summaryByFuel[fuel.id].total_received_price = fuelReceivedPrice;
      }

      const jsonReport = await this.getCarMonthlyReport({
        car_id,
        fuel_id,
        month: `${year}-${String(month).padStart(2, '0')}`,
      });

      const reportData = {
        car: {
          id: car.id,
          name: car.name,
          plate_number: car.plate_number,
        },
        fuels: fuelsToDisplay.map((f) => ({
          id: f.id,
          name: f.name,
          unit: f.unit,
          price: Number(f.price) || 0,
        })),
        year,
        month,
        days: jsonReport.days, // DRY: JSON endpointdan foydalanildi
        summaryByFuel,
      };

      return await generateCarMonthlyReportWorkbook(reportData);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('generateCarMonthlyReportExcel error:', error);
      throw new InternalServerErrorException(
        'Mashina Excel hisobotini generatsiya qilishda xatolik yuz berdi',
      );
    }
  }
}
