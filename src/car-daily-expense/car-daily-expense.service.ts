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
import { Op, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize';
import { CarDailyExpense } from './models/car-daily-expense.model';
import { CarFuelNorm } from '../car-fuel-norm/models/car-fuel-norm.model';
import { CreateCarDailyExpenseDto } from './dto/create-car-daily-expense.dto';
import { UpdateCarDailyExpenseDto } from './dto/update-car-daily-expense.dto';
import { QueryCarDailyExpenseDto } from './dto/query-car-daily-expense.dto';
import { Car } from '../cars/models/cars.models';
import { Fuel } from '../fuels/models/fuels.models';

@Injectable()
export class CarDailyExpenseService {
  constructor(
    @InjectModel(CarDailyExpense)
    private readonly expenseRepo: typeof CarDailyExpense,
    @InjectModel(Car) private readonly carRepo: typeof Car,
    @InjectModel(Fuel) private readonly fuelRepo: typeof Fuel,
    @InjectModel(CarFuelNorm)
    private readonly carFuelNormRepo: typeof CarFuelNorm,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

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
  }> {
    try {
      const {
        page,
        limit,
        car_id,
        fuel_id,
        date_from,
        date_to,
        is_holiday,
        search,
        sortBy,
        sortOrder,
      } = query;
      const offset = (page - 1) * limit;

      const where: WhereOptions = {};

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

      const include: any[] = [
        {
          model: Car,
          as: 'car',
        },
        {
          model: Fuel,
          as: 'fuel',
        },
      ];

      if (search) {
        include[0].where = {
          $or: [
            { name: { [Op.iLike]: `%${search}%` } },
            { plate_number: { [Op.iLike]: `%${search}%` } },
          ],
        } as any;
      }

      const order: [string, string][] = [];
      if (sortBy) {
        order.push([sortBy, sortOrder]);
      }

      const [data, total] = await Promise.all([
        this.expenseRepo.findAll({
          where,
          offset,
          limit,
          order,
          include,
        }),
        this.expenseRepo.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
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
            "Faqat shu mashina bo'yicha ENG OXIRGI yaratilgan rasxod yozuvini " +
              "(yoqilg'i turidan qat'i nazar) tahrirlash mumkin. Avvalgi " +
              'yozuvlar yopilgan hisoblanadi.',
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
            date: { [Op.lt]: record.date },
          },
          order: [['date', 'DESC']],
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
            "Faqat shu mashina bo'yicha ENG OXIRGI yaratilgan rasxod yozuvini " +
              "o'chirish mumkin.",
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
            date: { [Op.lt]: record.date },
          },
          order: [['date', 'DESC']],
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
    fuel_id: string,
    month: string,
  ): Promise<{
    records: CarDailyExpense[];
    total_mileage: number;
    total_received: number;
    total_fuel_expence: number;
    start_balance: number;
    end_balance: number;
  }> {
    try {
      const [year, monthNum] = month.split('-');
      const startDate = `${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${month}-${lastDay.toString().padStart(2, '0')}`;

      const records = await this.expenseRepo.findAll({
        where: {
          car_id,
          fuel_id,
          date: { [Op.between]: [startDate, endDate] },
        },
        order: [['date', 'ASC']],
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

      const total_mileage = records.reduce((sum, r) => sum + r.mileage, 0);
      const total_received = records.reduce(
        (sum, r) => sum + r.received_amount,
        0,
      );
      const total_fuel_expence = records.reduce(
        (sum, r) => sum + r.fuel_expence,
        0,
      );

      const firstRecord = records[0];
      const start_balance =
        firstRecord.balance_after -
        firstRecord.received_amount +
        firstRecord.fuel_expence;
      const end_balance = records[records.length - 1].balance_after;

      return {
        records,
        total_mileage,
        total_received,
        total_fuel_expence,
        start_balance,
        end_balance,
      };
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
}
