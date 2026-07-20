import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { Car } from './models/cars.models';
import { Employee } from '../employees/models/employee.model';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { QueryCarDto } from './dto/query-car.dto';

@Injectable()
export class CarService {
  constructor(
    @InjectModel(Car) private readonly carRepo: typeof Car,
    @InjectModel(Employee) private readonly employeeRepo: typeof Employee,
  ) {}

  async create(dto: CreateCarDto): Promise<Car> {
    try {
      const responsibleEmployee = await this.employeeRepo.findByPk(
        dto.responsible_employee_id,
      );
      if (!responsibleEmployee) {
        throw new NotFoundException("Mas'ul xodim topilmadi");
      }

      const driverEmployee = await this.employeeRepo.findByPk(dto.driver_id);
      if (!driverEmployee) {
        throw new NotFoundException('Haydovchi xodim topilmadi');
      }

      const existingCar = await this.carRepo.findOne({
        where: { plate_number: dto.plate_number },
      });

      if (existingCar) {
        throw new ConflictException(
          `"${dto.plate_number}" raqamli mashina allaqachon mavjud`,
        );
      }

      const car = await this.carRepo.create(dto);
      return car;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Car creation error:', error);
      throw new InternalServerErrorException(
        'Mashina yaratishda xatolik yuz berdi',
      );
    }
  }

  async findAll(query: QueryCarDto): Promise<{
    data: Car[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const {
        page,
        limit,
        search,
        is_active,
        responsible_employee_id,
        driver_id,
        sortBy,
        sortOrder,
      } = query;
      const offset = (page - 1) * limit;

      const where: WhereOptions = {};

      if (search) {
        where.$or = [
          { name: { [Op.iLike]: `%${search}%` } },
          { plate_number: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (is_active !== undefined) {
        where.is_active = is_active;
      }

      if (responsible_employee_id) {
        where.responsible_employee_id = responsible_employee_id;
      }

      if (driver_id) {
        where.driver_id = driver_id;
      }

      const order: [string, string][] = [];
      if (sortBy) {
        order.push([sortBy, sortOrder]);
      }

      const [data, total] = await Promise.all([
        this.carRepo.findAll({
          where,
          offset,
          limit,
          order,
          include: [
            {
              model: Employee,
              as: 'responsible_employee',
              attributes: ['id', 'full_name', 'phone', 'role'],
            },
            {
              model: Employee,
              as: 'driver',
              attributes: ['id', 'full_name', 'phone', 'role'],
            },
          ],
        }),
        this.carRepo.count({ where }),
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
      console.error('Car findAll error:', error);
      throw new InternalServerErrorException(
        'Mashinalarni olishda xatolik yuz berdi',
      );
    }
  }

  async findOne(id: string): Promise<Car> {
    try {
      const car = await this.carRepo.findByPk(id, {
        include: [
          {
            model: Employee,
            as: 'responsible_employee',
            attributes: ['id', 'full_name', 'phone', 'role'],
          },
          {
            model: Employee,
            as: 'driver',
            attributes: ['id', 'full_name', 'phone', 'role'],
          },
        ],
      });

      if (!car) {
        throw new NotFoundException(`ID ${id} bo'yicha mashina topilmadi`);
      }

      return car;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Car findOne error:', error);
      throw new InternalServerErrorException(
        'Mashinani olishda xatolik yuz berdi',
      );
    }
  }

  async update(id: string, dto: UpdateCarDto): Promise<Car> {
    try {
      await this.findOne(id);

      if (dto.plate_number) {
        const existingCar = await this.carRepo.findOne({
          where: {
            plate_number: dto.plate_number,
            id: { [Op.ne]: id },
          },
        });

        if (existingCar) {
          throw new ConflictException(
            `"${dto.plate_number}" raqamli mashina allaqachon mavjud`,
          );
        }
      }

      if (dto.responsible_employee_id) {
        const responsibleEmployee = await this.employeeRepo.findByPk(
          dto.responsible_employee_id,
        );
        if (!responsibleEmployee) {
          throw new NotFoundException("Mas'ul xodim topilmadi");
        }
      }

      if (dto.driver_id) {
        const driverEmployee = await this.employeeRepo.findByPk(dto.driver_id);
        if (!driverEmployee) {
          throw new NotFoundException('Haydovchi xodim topilmadi');
        }
      }

      const car = await this.carRepo.update(dto, {
        where: { id },
        returning: true,
      });

      return car[1][0];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Car update error:', error);
      throw new InternalServerErrorException(
        'Mashinani yangilashda xatolik yuz berdi',
      );
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const car = await this.findOne(id);

      await car.destroy();

      return { message: "Mashina muvaffaqiyatli o'chirildi" };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Car remove error:', error);
      throw new InternalServerErrorException(
        "Mashinani o'chirishda xatolik yuz berdi",
      );
    }
  }
}
