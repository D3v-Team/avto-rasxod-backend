import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { Fuel } from './models/fuels.models';
import { CreateFuelDto } from './dto/create-fuel.dto';
import { UpdateFuelDto } from './dto/update-fuel.dto';
import { QueryFuelDto } from './dto/query-fuel.dto';

@Injectable()
export class FuelService {
  constructor(@InjectModel(Fuel) private readonly fuelRepo: typeof Fuel) {}

  async create(dto: CreateFuelDto): Promise<Fuel> {
    try {
      const existingFuel = await this.fuelRepo.findOne({
        where: {
          name: {
            [Op.iLike]: dto.name,
          },
        },
      });

      if (existingFuel) {
        throw new ConflictException(
          `"${dto.name}" nomli fuel allaqachon mavjud`,
        );
      }

      const fuel = await this.fuelRepo.create(dto);
      return fuel;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Fuel yaratishda xatolik yuz berdi',
      );
    }
  }

  async findAll(query: QueryFuelDto): Promise<{
    data: Fuel[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { page, limit, search, sortBy, sortOrder } = query;
      const offset = (page - 1) * limit;

      const where: WhereOptions = {};

      if (search) {
        where.name = {
          [Op.iLike]: `%${search}%`,
        };
      }

      const order: [string, string][] = [];
      if (sortBy) {
        order.push([sortBy, sortOrder]);
      }

      const [data, total] = await Promise.all([
        this.fuelRepo.findAll({
          where,
          offset,
          limit,
          order,
        }),
        this.fuelRepo.count({ where }),
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
      throw new InternalServerErrorException(
        'Fuel larni olishda xatolik yuz berdi',
      );
    }
  }

  async findOne(id: string): Promise<Fuel> {
    try {
      const fuel = await this.fuelRepo.findByPk(id);
      if (!fuel) {
        throw new NotFoundException(`ID ${id} bo'yicha fuel topilmadi`);
      }
      return fuel;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Fuel ni olishda xatolik yuz berdi',
      );
    }
  }

  async update(id: string, dto: UpdateFuelDto): Promise<Fuel> {
    try {
      await this.findOne(id);

      if (dto.name) {
        const existingFuel = await this.fuelRepo.findOne({
          where: {
            name: {
              [Op.iLike]: dto.name,
            },
            id: {
              [Op.ne]: id,
            },
          },
        });

        if (existingFuel) {
          throw new ConflictException(
            `"${dto.name}" nomli fuel allaqachon mavjud`,
          );
        }
      }

      const fuel = await this.fuelRepo.update(dto, {
        where: { id },
        returning: true,
      });

      return fuel[1][0];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Fuel ni yangilashda xatolik yuz berdi',
      );
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const fuel = await this.findOne(id);
      await fuel.destroy();
      return { message: "Fuel muvaffaqiyatli o'chirildi" };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Fuel ni o'chirishda xatolik yuz berdi",
      );
    }
  }
}
