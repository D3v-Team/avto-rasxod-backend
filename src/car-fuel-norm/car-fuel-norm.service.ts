import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { CarFuelNorm } from './models/car-fuel-norm.model';
import { Car } from '../cars/models/cars.models';
import { Fuel } from '../fuels/models/fuels.models';
import { CreateCarFuelNormDto } from './dto/create-car-fuel-norm.dto';
import { UpdateCarFuelNormDto } from './dto/update-car-fuel-norm.dto';
import { QueryCarFuelNormDto } from './dto/query-car-fuel-norm.dto';

@Injectable()
export class CarFuelNormService {
  constructor(
    @InjectModel(CarFuelNorm)
    private readonly carFuelNormRepo: typeof CarFuelNorm,
    @InjectModel(Car) private readonly carRepo: typeof Car,
    @InjectModel(Fuel) private readonly fuelRepo: typeof Fuel,
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
      const { page, limit, car_id, fuel_id, search, sortBy, sortOrder } = query;
      const offset = (page - 1) * limit;

      const where: WhereOptions = {};

      if (car_id) {
        where.car_id = car_id;
      }

      if (fuel_id) {
        where.fuel_id = fuel_id;
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
        this.carFuelNormRepo.findAll({
          where,
          offset,
          limit,
          order,
          include,
        }),
        this.carFuelNormRepo.count({ where }),
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
      const carFuelNorm = await this.findOne(id);

      await carFuelNorm.destroy();

      return { message: "Norma muvaffaqiyatli o'chirildi" };
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
}
