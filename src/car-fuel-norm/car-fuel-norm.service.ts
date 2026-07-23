import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { IncludeOptions, Op, WhereOptions } from 'sequelize';
import { CarFuelNorm } from './models/car-fuel-norm.model';
import { Car } from '../cars/models/cars.models';
import { Fuel } from '../fuels/models/fuels.models';
import { CarDailyExpense } from '../car-daily-expense/models/car-daily-expense.model';
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
  ) {}

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

      const existingNorm = await this.carFuelNormRepo.findOne({
        where: { car_id: dto.car_id, fuel_id: dto.fuel_id },
      });

      if (existingNorm) {
        throw new ConflictException(
          "Bu mashina uchun shu yoqilg'i turida norma allaqachon mavjud",
        );
      }

      const carFuelNorm = await this.carFuelNormRepo.create(dto);
      return carFuelNorm;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
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
      await this.findOne(id);

      const carFuelNorm = await this.carFuelNormRepo.update(dto, {
        where: { id },
        returning: true,
      });

      return carFuelNorm[1][0];
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

      await record.update({ is_deleted: true });
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
}
