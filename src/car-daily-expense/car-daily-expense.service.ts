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

        const odometer_start = car.speedometer;
        const odometer_end = dto.odometer_end;

        if (odometer_end < odometer_start) {
          throw new BadRequestException(
            "Kun oxiridagi spidometr qiymati joriy spidometrdan kichik bo'lishi mumkin emas",
          );
        }

        const mileage = odometer_end - odometer_start;
        const fuel_expence = (mileage * carFuelNorm.norm_per_100km) / 100;
        const balance_after =
          carFuelNorm.current_balance + dto.received_amount - fuel_expence;

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
            received_amount: dto.received_amount,
            fuel_expence,
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

      const [data, total, totalsRaw] = await Promise.all([
        this.expenseRepo.findAll({
          where,
          offset,
          limit: limitNum,
          order,
          include,
          subQuery: false,
        }),
        this.expenseRepo.count({ where, include, distinct: true }),
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
                'SUM(COALESCE("CarDailyExpense"."received_amount", 0) * COALESCE("fuel"."price", 0))',
              ),
              'total_price_sum',
            ],
          ],
          group: ['fuel_id'],
          raw: true,
          subQuery: false,
        }),
      ]);

      const totals = (totalsRaw as any[]).map((row) => ({
        fuel_id: row.fuel_id,
        fuel_name: row.fuel_name || '',
        fuel_unit: row.fuel_unit || '',
        total_received_amount: Number(row.total_received_amount) || 0,
        total_fuel_expence: Number(row.total_fuel_expence) || 0,
        total_mileage: Number(row.total_mileage) || 0,
        total_price_sum: Number(row.total_price_sum) || 0,
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
    days: Array<{ date: string; expenses: any[] }>;
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

      const days: Array<{ date: string; expenses: any[] }> = [];
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
        });
      });

      for (let day = 1; day <= daysInMonth; day++) {
        const date = `${query.month}-${day.toString().padStart(2, '0')}`;
        days.push({
          date,
          expenses: expensesByDate[date] || [],
        });
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
            const m_reaceved_price = m_received * fuel.price;

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
}
