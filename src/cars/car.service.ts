import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize';
import { Car } from './models/cars.models';
import { Employee } from '../employees/models/employee.model';
import { CarFuelNorm } from '../car-fuel-norm/models/car-fuel-norm.model';
import { CarDailyExpense } from '../car-daily-expense/models/car-daily-expense.model';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { QueryCarDto } from './dto/query-car.dto';

@Injectable()
export class CarService {
  constructor(
    @InjectModel(Car) private readonly carRepo: typeof Car,
    @InjectModel(Employee) private readonly employeeRepo: typeof Employee,
    @InjectModel(CarFuelNorm)
    private readonly carFuelNormRepo: typeof CarFuelNorm,
    @InjectModel(CarDailyExpense)
    private readonly carDailyExpenseRepo: typeof CarDailyExpense,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) { }

  async create(dto: CreateCarDto): Promise<Car> {
    try {
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
        is_deleted,
      } = query;
      const offset = (page - 1) * limit;

      // where: any qilib olamiz, chunki Op.or symbol kalit, WhereOptions
      // generic siz bu kalitni qabul qilmaydi (TS2538 xatosi shundan)
      const where: any = {};

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { plate_number: { [Op.iLike]: `%${search}%` } },
        ];
      }

      // is_active faqat undefined BO'LMAGANDA filtrlanadi — DTO dagi
      // @Transform to'g'ri sozlangan bo'lishi SHART (value===undefined -> undefined)
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

      let scope: string | undefined = undefined;
      if (is_deleted === true) {
        scope = 'onlyDeleted';
      }

      const repo = scope ? this.carRepo.scope(scope) : this.carRepo;

      const [data, total] = await Promise.all([
        repo.findAll({
          where,
          offset,
          limit,
          order,
          subQuery: false,
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
            {
              model: CarFuelNorm,
              as: 'car_fuel_norm',
              attributes: ['current_balance'],
              required: false,
            },
          ],
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
            required: false,
          },
          {
            model: Employee,
            as: 'driver',
            attributes: ['id', 'full_name', 'phone', 'role'],
            required: false,
          },
          {
            model: CarFuelNorm,
            as: 'car_fuel_norm',
            attributes: ['current_balance'],
            required: false,
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
      await car.update({ is_deleted: true });
      return { message: "Mashina arxivlandi (o'chirildi)" };
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

  async restore(id: string): Promise<{ message: string }> {
    try {
      const car = await this.carRepo.scope('onlyDeleted').findByPk(id);
      if (!car) {
        throw new NotFoundException(
          `ID ${id} bo'yicha arxivlangan mashina topilmadi`,
        );
      }
      await car.update({ is_deleted: false });
      return { message: 'Mashina tiklandi' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Restore car error:', error);
      throw new InternalServerErrorException('Tiklashda xatolik yuz berdi');
    }
  }
}
