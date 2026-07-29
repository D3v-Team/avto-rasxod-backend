import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { IncludeOptions, Op, WhereOptions, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CarFuelNorm } from './models/car-fuel-norm.model';
import { CarFuelNormHistoryService } from '../car-fuel-norm-history/car-fuel-norm-history.service';
import { CarFuelNormHistory } from '../car-fuel-norm-history/models/car-fuel-norm-history.model';
import { Fuel } from '../fuels/models/fuels.models';
import { Car } from '../cars/models/cars.models';
import { CarDailyExpense } from '../car-daily-expense/models/car-daily-expense.model';
import { CarDailyExpenseService } from '../car-daily-expense/car-daily-expense.service';
import { CreateCarFuelNormDto } from './dto/create-car-fuel-norm.dto';
import { UpdateCarFuelNormDto } from './dto/update-car-fuel-norm.dto';
import { QueryCarFuelNormDto } from './dto/query-car-fuel-norm.dto';
import { normalizeName } from '../common/utils/normalize-name.util';

// DIQQAT: CarFuelNorm modulida inson kiritadigan matnli maydonlar (nom, username v.b.) yo'q,
// faqat ID, raqamlar va FK lar mavjud bo'lgani sababli normalizeName() FAQAT GET search parametrida qo'llaniladi.

@Injectable()
export class CarFuelNormService {
  constructor(
    @InjectModel(CarFuelNorm)
    private readonly carFuelNormRepo: typeof CarFuelNorm,
    @InjectModel(Car) private readonly carRepo: typeof Car,
    @InjectModel(Fuel) private readonly fuelRepo: typeof Fuel,
    @InjectModel(CarDailyExpense)
    private readonly carDailyExpenseRepo: typeof CarDailyExpense,
    private readonly carFuelNormHistoryService: CarFuelNormHistoryService,
    @Inject(forwardRef(() => CarDailyExpenseService))
    private readonly carDailyExpenseService: CarDailyExpenseService,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) { }

  async create(dto: CreateCarFuelNormDto): Promise<CarFuelNorm> {
    try {
      const car = await this.carRepo.findByPk(dto.car_id);
      if (!car) {
        throw new NotFoundException('Mashina topilmadi');
      }

      const fuel = await this.fuelRepo.findByPk(dto.fuel_id);
      if (!fuel) {
        throw new NotFoundException("Yoqilg'i turi topilmadi");
      }

      const effectiveFrom =
        dto.effective_from ?? new Date().toISOString().split('T')[0];

      const today = new Date().toISOString().split('T')[0];
      if (effectiveFrom > today) {
        throw new BadRequestException(
          "Norma amal qilish sanasi kelajakka tegishli bo'lishi mumkin emas",
        );
      }

      return await this.sequelize.transaction(async (t) => {
        const existingNorm = await this.carFuelNormRepo
          .scope('withDeleted')
          .findOne({
            where: { car_id: dto.car_id, fuel_id: dto.fuel_id },
            transaction: t,
            lock: t.LOCK.UPDATE,
          });

        if (existingNorm) {
          if (!existingNorm.is_deleted) {
            throw new ConflictException(
              "Bu mashina uchun shu yoqilg'i turida norma allaqachon mavjud",
            );
          }

          // Soft-deleted normani tiklash + TO'G'RI tarix algoritmi orqali yangi davr qo'shish
          await existingNorm.update(
            { is_deleted: false },
            { transaction: t },
          );

          await this.insertNormHistoryEntry(
            existingNorm,
            effectiveFrom,
            t,
            dto.norm_per_100km,
          );

          // DIQQAT: parametr — car_id, CarFuelNorm.id EMAS
          await this.carDailyExpenseService.recalculateCarChain(
            existingNorm.car_id,
            t,
          );

          return existingNorm;
        }

        // Butunlay yangi (car_id, fuel_id) — birinchi marta yaratilmoqda
        const norm = await this.carFuelNormRepo.create(
          {
            car_id: dto.car_id,
            fuel_id: dto.fuel_id,
            norm_per_100km: dto.norm_per_100km,
            initial_balance: dto.current_balance ?? 0,
            current_balance: dto.current_balance ?? 0,
          },
          { transaction: t },
        );

        await this.insertNormHistoryEntry(
          norm,
          effectiveFrom,
          t,
          dto.norm_per_100km,
        );

        return norm;
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('CarFuelNorm creation error:', error);
      throw new InternalServerErrorException(
        'Norma yaratishda xatolik yuz berdi',
      );
    }
  }

  async findAll(query: QueryCarFuelNormDto): Promise<{
    data: CarFuelNorm[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        car_id,
        fuel_id,
        search,
        sortBy,
        sortOrder,
        is_deleted,
      } = query;
      const offset = (page - 1) * limit;

      const where: WhereOptions = {};

      if (car_id) {
        where.car_id = car_id;
      }

      if (fuel_id) {
        where.fuel_id = fuel_id;
      }

      const include: IncludeOptions[] = [
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
        const normalizedSearch = normalizeName(search);
        include[0].where = {
          [Op.or]: [
            { name: { [Op.iLike]: `%${normalizedSearch}%` } },
            { plate_number: { [Op.iLike]: `%${normalizedSearch}%` } },
          ],
        };
      }

      const order: [string, string][] = [];
      if (sortBy) {
        order.push([sortBy, sortOrder]);
      }

      let scope: string | undefined = undefined;
      if (is_deleted === true) {
        scope = 'onlyDeleted';
      }

      const repo = scope
        ? this.carFuelNormRepo.scope(scope)
        : this.carFuelNormRepo;

      const [data, total] = await Promise.all([
        repo.findAll({
          where,
          offset,
          limit,
          order,
          include,
        }),
        repo.count({ where }),
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
      console.error('CarFuelNorm findAll error:', error);
      throw new InternalServerErrorException(
        'Normalarni olishda xatolik yuz berdi',
      );
    }
  }

  async findOne(id: string): Promise<CarFuelNorm> {
    try {
      const carFuelNorm = await this.carFuelNormRepo.findByPk(id, {
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

      if (!carFuelNorm) {
        throw new NotFoundException(`ID ${id} bo'yicha norma topilmadi`);
      }

      return carFuelNorm;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarFuelNorm findOne error:', error);
      throw new InternalServerErrorException(
        'Normani olishda xatolik yuz berdi',
      );
    }
  }

  async update(id: string, dto: UpdateCarFuelNormDto): Promise<CarFuelNorm> {
    try {
      const existing = await this.findOne(id);

      return await this.sequelize.transaction(async (t) => {
        const carFuelNorm = await this.carFuelNormRepo.update(dto, {
          where: { id },
          returning: true,
          transaction: t,
        });

        if (dto.initial_balance !== undefined || dto.current_balance !== undefined) {
          await this.carDailyExpenseService.recalculateCarChain(
            existing.car_id,
            t,
          );
        }

        return carFuelNorm[1][0];
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarFuelNorm update error:', error);
      throw new InternalServerErrorException(
        'Normani yangilashda xatolik yuz berdi',
      );
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const record = await this.findOne(id);

      const relatedExpensesCount = await this.carDailyExpenseRepo.count({
        where: { car_id: record.car_id, fuel_id: record.fuel_id },
      });

      if (relatedExpensesCount > 0) {
        throw new ConflictException(
          "Bu norma bo'yicha rasxod tarixi mavjud, shuning uchun " +
          "o'chirib (arxivlab) bo'lmaydi. Avval mashinani boshqa " +
          "yoqilg'i normasiga o'tkazing yoki tarixiy yozuvlarni " +
          "ko'rib chiqing",
        );
      }

      await this.sequelize.transaction(async (t) => {
        await record.update({ is_deleted: true }, { transaction: t });
        const today = new Date().toISOString().split('T')[0];
        await this.carFuelNormHistoryService.closeActiveHistory(record.id, today, t);
      });
      return { message: "Yoqilg'i normasi muvaffaqiyatli arxivlandi" };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('CarFuelNorm remove error:', error);
      throw new InternalServerErrorException(
        "Normani o'chirishda xatolik yuz berdi",
      );
    }
  }

  async restore(id: string): Promise<{ message: string }> {
    try {
      const carFuelNorm = await this.carFuelNormRepo
        .scope('onlyDeleted')
        .findByPk(id);
      if (!carFuelNorm) {
        throw new NotFoundException(
          `ID ${id} bo'yicha arxivlangan norma topilmadi`,
        );
      }
      await carFuelNorm.update({ is_deleted: false });
      return { message: 'Norma muvaffaqiyatli tiklandi' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Restore carFuelNorm error:', error);
      throw new InternalServerErrorException(
        'Normani tiklashda xatolik yuz berdi',
      );
    }
  }
  private subtractOneDay(dateStr: string): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }

  private async insertNormHistoryEntry(
    carFuelNorm: CarFuelNorm,
    effectiveFrom: string,
    t: Transaction,
    newNormPer100km?: number,
    newPrice?: number,
  ): Promise<void> {
    const existingHistoryCount = await CarFuelNormHistory.count({
      where: { car_fuel_norm_id: carFuelNorm.id },
      transaction: t,
    });

    if (existingHistoryCount === 0) {
      // BIRINCHI YOZUV (Umuman tarix yo'q holat)
      const fuel = await Fuel.findByPk(carFuelNorm.fuel_id, { transaction: t });
      const currentFuelPrice = fuel ? fuel.price : 0;
      
      const resolvedNorm = newNormPer100km ?? 0;
      const resolvedPrice = newPrice ?? currentFuelPrice;

      await CarFuelNormHistory.create({
        car_fuel_norm_id: carFuelNorm.id,
        norm_per_100km: resolvedNorm,
        fuel_price_at_time: resolvedPrice,
        effective_from: effectiveFrom,
        effective_to: null,
      }, { transaction: t });

      await carFuelNorm.update(
        { norm_per_100km: resolvedNorm },
        { transaction: t },
      );
      return;
    }

    const earliestRecord = await CarFuelNormHistory.findOne({
      where: { car_fuel_norm_id: carFuelNorm.id },
      order: [['effective_from', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // HOLAT 3: Eng birinchi yozuvdan ham oldinroq
    if (effectiveFrom < earliestRecord.effective_from) {
      const resolvedNorm = newNormPer100km ?? earliestRecord.norm_per_100km;
      const resolvedPrice = newPrice ?? earliestRecord.fuel_price_at_time;

      await CarFuelNormHistory.create({
        car_fuel_norm_id: carFuelNorm.id,
        norm_per_100km: resolvedNorm,
        fuel_price_at_time: resolvedPrice,
        effective_from: effectiveFrom,
        effective_to: this.subtractOneDay(earliestRecord.effective_from),
      }, { transaction: t });

      return;
    }

    // HOLAT 3.5: Eng birinchi yozuv sanasi bilan AYNAN BIR XIL (UPDATE holati)
    if (effectiveFrom === earliestRecord.effective_from) {
      const resolvedNorm = newNormPer100km ?? earliestRecord.norm_per_100km;
      const resolvedPrice = newPrice ?? earliestRecord.fuel_price_at_time;

      await earliestRecord.update(
        {
          norm_per_100km: resolvedNorm,
          fuel_price_at_time: resolvedPrice,
        },
        { transaction: t },
      );

      // Agar bu yozuv JORIY (effective_to === null) davri bo'lsa, normani yangilaymiz
      if (earliestRecord.effective_to === null) {
        await carFuelNorm.update(
          { norm_per_100km: resolvedNorm },
          { transaction: t }
        );
      }
      return;
    }

    // HOLAT 2: earliestRecord'dan KEYIN
    const containingRecord = await CarFuelNormHistory.findOne({
      where: {
        car_fuel_norm_id: carFuelNorm.id,
        effective_from: { [Op.lte]: effectiveFrom },
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: effectiveFrom } },
        ],
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!containingRecord) {
      throw new InternalServerErrorException(
        "Norma tarixini aniqlashda kutilmagan xatolik yuz berdi",
      );
    }

    // HOLAT: containingRecord sanasi bilan AYNAN BIR XIL (UPDATE holati)
    if (effectiveFrom === containingRecord.effective_from) {
      const resolvedNorm = newNormPer100km ?? containingRecord.norm_per_100km;
      const resolvedPrice = newPrice ?? containingRecord.fuel_price_at_time;

      await containingRecord.update(
        {
          norm_per_100km: resolvedNorm,
          fuel_price_at_time: resolvedPrice,
        },
        { transaction: t },
      );

      // Agar bu yozuv JORIY (effective_to === null) davri bo'lsa, normani yangilaymiz
      if (containingRecord.effective_to === null) {
        await carFuelNorm.update(
          { norm_per_100km: resolvedNorm },
          { transaction: t }
        );
      }
      return;
    }

    // X containingRecord ichiga tushadi (YANGI BO'LINISH holati)
    const resolvedNorm = newNormPer100km ?? containingRecord.norm_per_100km;
    const resolvedPrice = newPrice ?? containingRecord.fuel_price_at_time;

    const nextRecord = await CarFuelNormHistory.findOne({
      where: {
        car_fuel_norm_id: carFuelNorm.id,
        effective_from: { [Op.gt]: effectiveFrom },
      },
      order: [['effective_from', 'ASC']],
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    let newEffectiveTo = null;
    if (nextRecord) {
      newEffectiveTo = this.subtractOneDay(nextRecord.effective_from);
    }

    await containingRecord.update(
      { effective_to: this.subtractOneDay(effectiveFrom) },
      { transaction: t },
    );

    await CarFuelNormHistory.create({
      car_fuel_norm_id: carFuelNorm.id,
      norm_per_100km: resolvedNorm,
      fuel_price_at_time: resolvedPrice,
      effective_from: effectiveFrom,
      effective_to: newEffectiveTo,
    }, { transaction: t });

    if (newEffectiveTo === null) {
      await carFuelNorm.update(
        { norm_per_100km: resolvedNorm },
        { transaction: t },
      );
    }
  }

  async updateNormHistoryEntry(
    carFuelNormId: string,
    effectiveFrom: string,
    t: Transaction,
    newNormPer100km?: number,
    newPrice?: number,
  ): Promise<void> {
    if (newNormPer100km === undefined && newPrice === undefined) {
      throw new BadRequestException(
        "Kamida bittasi kiritilishi shart: norma yoki narx",
      );
    }

    const today = new Date().toISOString().split('T')[0];
    if (effectiveFrom > today) {
      throw new BadRequestException(
        "Amal qilish sanasi kelajakka tegishli bo'lishi mumkin emas",
      );
    }

    const carFuelNorm = await this.carFuelNormRepo.findByPk(carFuelNormId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    
    if (!carFuelNorm) throw new NotFoundException('Norma topilmadi');

    await this.insertNormHistoryEntry(
      carFuelNorm,
      effectiveFrom,
      t,
      newNormPer100km,
      newPrice,
    );

    // Fuel.price faqat narx BERILGAN bo'lsa yangilanadi (kelajak sanalar yuqorida bloklangan)
    if (newPrice !== undefined) {
      await Fuel.update(
        { price: newPrice },
        { where: { id: carFuelNorm.fuel_id }, transaction: t },
      );
    }

    // Har qanday o'zgarish bo'lganda zanjirni qayta hisoblaymiz
    await this.carDailyExpenseService.recalculateCarChain(
      carFuelNorm.car_id,
      t,
    );
  }
}

