import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions, IncludeOptions } from 'sequelize';
import { Car } from '../cars/models/cars.models';
import { Employee } from '../employees/models/employee.model';
import { CreateCarSparePartsExpenseDto } from './dto/create-car-spare-parts-expense.dto';
import { UpdateCarSparePartsExpenseDto } from './dto/update-car-spare-parts-expense.dto';
import { QueryCarSparePartsExpenseDto } from './dto/query-car-spare-parts-expense.dto';
import { CarSparePartsExpense } from './models/car-spare-parts-expense.model';
import { ReportQueryDto } from './dto/report-query.dto';
import { generateCarSparePartsReportExcel } from './excel/car-spare-parts-report.excel';
import { ConfigService } from '@nestjs/config';
const include:IncludeOptions[] = [
  {
    model: Car,
    as: 'car',
    attributes: ['id', 'name', 'plate_number'],
  },
  {
    model: Employee,
    as: 'responsible_employee',
    attributes: ['id', 'full_name'],
    required: false,   // ← qo'shildi
  },
  {
    model: Employee,
    as: 'driver',
    attributes: ['id', 'full_name'],
    required: false,   // ← qo'shildi
  },
];
@Injectable()
export class CarSparePartsExpenseService {
  constructor(
    @InjectModel(CarSparePartsExpense)
    private readonly expenseRepo: typeof CarSparePartsExpense,
    @InjectModel(Car) private readonly carRepo: typeof Car,
    private readonly configService: ConfigService,
  ) { }

  async findAll(query: QueryCarSparePartsExpenseDto) {
    try {
      const {
        page = 1,
        limit = 15,
        car_id,
        date_from,
        date_to,
        payment_type,
        search,
      } = query;
      const offset = (page - 1) * limit;
      console.log('query', query)
      const where: WhereOptions = {};

      if (car_id) {
        where.car_id = car_id;
      }

      if (date_from || date_to) {
        if (date_from && date_to) {
          where.date = { [Op.between]: [date_from, date_to] };
        } else if (date_from) {
          where.date = { [Op.gte]: date_from };
        } else if (date_to) {
          where.date = { [Op.lte]: date_to };
        }
      }

      if (payment_type) {
        where.payment_type = payment_type;
      }

      if (search) {
        where.part_name = { [Op.iLike]: `%${search}%` };
      }

      const include: IncludeOptions[] = [
  {
    model: Car,
    as: 'car',
    attributes: ['id', 'name', 'plate_number'],
  },
  {
    model: Employee,
    as: 'responsible_employee',
    attributes: ['id', 'full_name'],
    required: false,   // ← qo'shildi
  },
  {
    model: Employee,
    as: 'driver',
    attributes: ['id', 'full_name'],
    required: false,   // ← qo'shildi
  },
];

      const [data, total] = await Promise.all([
        this.expenseRepo.findAll({
          where,
          offset,
          limit,
          order: [
            ['date', 'DESC'],
            ['createdAt', 'DESC'],
          ],
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
      if (error instanceof HttpException) throw error;
      console.error('CarSparePartsExpense findAll error:', error);
      throw new InternalServerErrorException(
        'Ehtiyot qismlar xarajatlarini olishda xatolik yuz berdi',
      );
    }
  }

  async exportExcelReport(query: ReportQueryDto): Promise<Buffer> {
    try {
      const { date_from, date_to } = query;

      const cars = await this.carRepo.findAll({
        where: { is_deleted: false },
        order: [['name', 'ASC']],
        include: [
          {
            model: CarSparePartsExpense,
            as: 'car_spare_parts_expenses',
            where: {
              date: {
                [Op.between]: [date_from, date_to],
              },
            },
            required: false,
          },
        ],
      });

      // Ehtiyot qismlarni sana bo'yicha tartiblash (ASC) chunki include ichida order berish ba'zan to'g'ri ishlamasligi mumkin
      cars.forEach((car) => {
        if (car.car_spare_parts_expenses && car.car_spare_parts_expenses.length > 0) {
          car.car_spare_parts_expenses.sort((a, b) => {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
          });
        }
      });

      const orgName = this.configService.get<string>('ORGANIZATION_NAME', 'ЎҚУФ Сирдарё вилояти Кенгашининг');

      return await generateCarSparePartsReportExcel(cars, date_from, date_to, orgName);
    } catch (error) {
      console.error('CarSparePartsExpense exportExcelReport error:', error);
      throw new InternalServerErrorException(
        'Excel hisobotini yaratishda xatolik yuz berdi',
      );
    }
  }

  async findOne(id: string): Promise<CarSparePartsExpense> {
    try {
      const expense = await this.expenseRepo.findByPk(id, {
        include
      });

      if (!expense) {
        throw new NotFoundException('Yozuv topilmadi');
      }

      return expense;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('CarSparePartsExpense findOne error:', error);
      throw new InternalServerErrorException(
        'Xarajatni olishda xatolik yuz berdi',
      );
    }
  }

  async create(dto: CreateCarSparePartsExpenseDto): Promise<CarSparePartsExpense> {
    try {
      const car = await this.carRepo.findByPk(dto.car_id, {
      });
      if (!car) {
        throw new NotFoundException('Mashina topilmadi');
      }

      return await this.expenseRepo.create({
        ...dto,
        responsible_employee_id_at_time: car.responsible_employee?.id || null,
        driver_id_at_time: car.driver?.id || null,
      });
      
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('CarSparePartsExpense create error:', error);
      throw new InternalServerErrorException(
        'Xarajat yaratishda xatolik yuz berdi',
      );
    }
  }

  async update(
    id: string,
    dto: UpdateCarSparePartsExpenseDto,
  ): Promise<CarSparePartsExpense> {
    try {
      await this.findOne(id);

      await this.expenseRepo.update(dto as any, {
        where: { id },
      });

      return this.findOne(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('CarSparePartsExpense update error:', error);
      throw new InternalServerErrorException(
        'Xarajatni yangilashda xatolik yuz berdi',
      );
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      const expense = await this.findOne(id);
      await expense.destroy();
      return { message: "Muvaffaqiyatli o'chirildi" };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('CarSparePartsExpense remove error:', error);
      throw new InternalServerErrorException(
        "Xarajatni o'chirishda xatolik yuz berdi",
      );
    }
  }
}
