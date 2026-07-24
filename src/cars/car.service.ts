import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize';
import { Car } from './models/cars.models';
import { Employee } from '../employees/models/employee.model';
import { CarFuelNorm } from '../car-fuel-norm/models/car-fuel-norm.model';
import { CarDailyExpense } from '../car-daily-expense/models/car-daily-expense.model';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { QueryCarDto } from './dto/query-car.dto';
import { normalizeName } from '../common/utils/normalize-name.util';
import { Fuel } from '../fuels/models/fuels.models';

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
      // Normalizatsiya name va plate_number maydonlariga qo'llanadi
      const normalizedDto = {
        ...dto,
        name: normalizeName(dto.name),
        plate_number: normalizeName(dto.plate_number),
      };

      if (normalizedDto.responsible_employee_id) {
        const responsibleEmployee = await this.employeeRepo.findByPk(
          normalizedDto.responsible_employee_id,
        );
        if (!responsibleEmployee) {
          throw new NotFoundException("Mas'ul xodim topilmadi");
        }
      }

      if (normalizedDto.driver_id) {
        const driverEmployee = await this.employeeRepo.findByPk(
          normalizedDto.driver_id,
        );
        if (!driverEmployee) {
          throw new NotFoundException('Haydovchi xodim topilmadi');
        }
      }

      // Unikal tekshiruv normalizatsiya qilingan plate_number bo'yicha bajariladi
      const existingCar = await this.carRepo.findOne({
        where: { plate_number: normalizedDto.plate_number },
      });

      if (existingCar) {
        throw new ConflictException(
          `"${normalizedDto.plate_number}" davlat raqamli mashina allaqachon mavjud`,
        );
      }

      const car = await this.carRepo.create(normalizedDto);
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
        page = 1,
        limit = 10,
        search,
        is_active,
        responsible_employee_id,
        driver_id,
        sortBy,
        sortOrder,
        is_deleted,
      } = query;
      const offset = (page - 1) * limit;

      const where: any = {};

      if (search) {
        const normalizedSearch = normalizeName(search);
        where[Op.or] = [
          { name: { [Op.iLike]: `%${normalizedSearch}%` } },
          { plate_number: { [Op.iLike]: `%${normalizedSearch}%` } },
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
              include: [
                {
                  model: Fuel,
                  as: 'fuel',
                  attributes: ['name'],
                  required: false,
                },
              ],
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

      const normalizedDto: any = { ...dto };
      if (dto.name !== undefined) {
        normalizedDto.name = normalizeName(dto.name);
      }
      if (dto.plate_number !== undefined) {
        normalizedDto.plate_number = normalizeName(dto.plate_number);
      }

      // Unikal tekshiruv normalizatsiya qilingan plate_number bo'yicha bajariladi
      if (normalizedDto.plate_number) {
        const existingCar = await this.carRepo.findOne({
          where: {
            plate_number: normalizedDto.plate_number,
            id: { [Op.ne]: id },
          },
        });

        if (existingCar) {
          throw new ConflictException(
            `"${normalizedDto.plate_number}" davlat raqamli mashina allaqachon mavjud`,
          );
        }
      }

      if (normalizedDto.responsible_employee_id) {
        const responsibleEmployee = await this.employeeRepo.findByPk(
          normalizedDto.responsible_employee_id,
        );
        if (!responsibleEmployee) {
          throw new NotFoundException("Mas'ul xodim topilmadi");
        }
      }

      if (normalizedDto.driver_id) {
        const driverEmployee = await this.employeeRepo.findByPk(
          normalizedDto.driver_id,
        );
        if (!driverEmployee) {
          throw new NotFoundException('Haydovchi xodim topilmadi');
        }
      }

      const car = await this.carRepo.update(normalizedDto, {
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
      return { message: 'Mashina muvaffaqiyatli arxivlandi' };
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
      return { message: 'Mashina muvaffaqiyatli tiklandi' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Restore car error:', error);
      throw new InternalServerErrorException(
        'Mashinani tiklashda xatolik yuz berdi',
      );
    }
  }
}
