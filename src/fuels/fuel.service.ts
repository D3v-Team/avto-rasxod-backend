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
import { normalizeName } from '../common/utils/normalize-name.util';

@Injectable()
export class FuelService {
  constructor(@InjectModel(Fuel) private readonly fuelRepo: typeof Fuel) {}

  async create(dto: CreateFuelDto): Promise<Fuel> {
    try {
      // Normalizatsiya faqat name maydoniga qo'llanadi (unit o'lchov birligiga tegmaymiz)
      const normalizedDto = {
        ...dto,
        name: normalizeName(dto.name),
      };

      // Unikal tekshiruv normalizatsiya qilingan name bo'yicha bajariladi
      const existingFuel = await this.fuelRepo.findOne({
        where: { name: normalizedDto.name },
      });

      if (existingFuel) {
        throw new ConflictException(
          `"${normalizedDto.name}" nomli yoqilg'i turi allaqachon mavjud`,
        );
      }

      const fuel = await this.fuelRepo.create(normalizedDto);
      return fuel;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Yoqilg'i turini yaratishda xatolik yuz berdi",
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
      const { page = 1, limit = 10, search, sortBy, sortOrder } = query;
      const offset = (page - 1) * limit;

      const where: WhereOptions = {};

      if (search) {
        const normalizedSearch = normalizeName(search);
        where.name = {
          [Op.iLike]: `%${normalizedSearch}%`,
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
        "Yoqilg'i turlarini olishda xatolik yuz berdi",
      );
    }
  }

  async findOne(id: string): Promise<Fuel> {
    try {
      const fuel = await this.fuelRepo.findByPk(id);
      if (!fuel) {
        throw new NotFoundException(`ID ${id} bo'yicha yoqilg'i turi topilmadi`);
      }
      return fuel;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Yoqilg'i turini olishda xatolik yuz berdi",
      );
    }
  }

  async update(id: string, dto: UpdateFuelDto): Promise<Fuel> {
    try {
      await this.findOne(id);

      const normalizedDto: any = { ...dto };
      if (dto.name !== undefined) {
        normalizedDto.name = normalizeName(dto.name);
        // Unikal tekshiruv normalizatsiya qilingan name bo'yicha bajariladi
        const existingFuel = await this.fuelRepo.findOne({
          where: {
            name: normalizedDto.name,
            id: { [Op.ne]: id },
          },
        });

        if (existingFuel) {
          throw new ConflictException(
            `"${normalizedDto.name}" nomli yoqilg'i turi allaqachon mavjud`,
          );
        }
      }

      const fuel = await this.fuelRepo.update(normalizedDto, {
        where: { id },
        returning: true,
      });

      return fuel[1][0];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Yoqilg'i turini yangilashda xatolik yuz berdi",
      );
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const fuel = await this.findOne(id);
      await fuel.destroy();
      return { message: "Yoqilg'i turi muvaffaqiyatli o'chirildi" };
    } catch (error: any) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error.name === 'SequelizeForeignKeyConstraintError') {
        throw new ConflictException(
          "Bu yoqilg'i turidan boshqa joylarda (norma yoki rasxodlarda) foydalanilganligi sababli uni o'chirib bo'lmaydi",
        );
      }
      console.error('Fuel delete error:', error);
      throw new InternalServerErrorException(
        "Yoqilg'i turini o'chirishda xatolik yuz berdi",
      );
    }
  }
}
