import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Employee } from './models/employee.model';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryIs_deleteDto } from './dto/query-employee.dto';
import { EmployeeRole } from '../common/enums/employee-role.enum';
import { Op } from 'sequelize';
import { normalizeName } from '../common/utils/normalize-name.util';

const PAGE_LIMIT = 10;

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee) private readonly employeeRepo: typeof Employee,
  ) {}

  async create(dto: CreateEmployeeDto) {
    // Normalizatsiya kiritilgan to'liq ism maydoniga qo'llanadi
    const normalizedDto = {
      ...dto,
      full_name: normalizeName(dto.full_name),
    };
    await this.employeeRepo.create(normalizedDto);
    return { message: 'Xodim muvaffaqiyatli yaratildi' };
  }

  async findAll(query: QueryIs_deleteDto) {
    try {
      const { is_deleted } = query;

      let scope: string | undefined = undefined;
      if (is_deleted === true) {
        scope = 'onlyDeleted';
      }

      const repo = scope ? this.employeeRepo.scope(scope) : this.employeeRepo;

      return repo.findAll();
    } catch (error) {
      console.error('FindAll employees error:', error);
      throw new InternalServerErrorException(
        'Xodimlarni olishda xatolik yuz berdi',
      );
    }
  }

  async filter({
    role,
    searchTerm,
    page = 1,
    is_deleted,
  }: {
    role?: EmployeeRole;
    searchTerm?: string;
    page?: number;
    is_deleted?: boolean;
  }) {
    const { limit, offset } = this.buildPagination(page);
    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (searchTerm) {
      const normalizedSearch = normalizeName(searchTerm);
      where[Op.or] = [
        { full_name: { [Op.iLike]: `%${normalizedSearch}%` } },
        { phone: { [Op.iLike]: `%${normalizedSearch}%` } },
      ];
    }

    let scope: string | undefined = undefined;
    if (is_deleted === true) {
      scope = 'onlyDeleted';
    }

    const repo = scope ? this.employeeRepo.scope(scope) : this.employeeRepo;

    const records = await repo.findAll({
      where,
      limit,
      offset,
    });

    const total_count = await repo.count({ where });
    return this.buildPageResponse(records, total_count, page);
  }

  async findOne(id: string) {
    const employee = await this.employeeRepo.findByPk(id);
    if (!employee) {
      throw new NotFoundException(`ID ${id} bo'yicha xodim topilmadi`);
    }
    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);
    const normalizedDto: any = { ...dto };
    if (dto.full_name !== undefined) {
      normalizedDto.full_name = normalizeName(dto.full_name);
    }

    await employee.update(normalizedDto);
    return { message: 'Xodim muvaffaqiyatli yangilandi' };
  }

  async remove(id: string) {
    const employee = await this.findOne(id);
    await employee.update({ is_deleted: true });
    return { message: 'Xodim muvaffaqiyatli arxivlandi' };
  }

  async restore(id: string): Promise<{ message: string }> {
    try {
      const employee = await this.employeeRepo
        .scope('onlyDeleted')
        .findByPk(id);
      if (!employee) {
        throw new NotFoundException(
          `ID ${id} bo'yicha arxivlangan xodim topilmadi`,
        );
      }
      await employee.update({ is_deleted: false });
      return { message: 'Xodim muvaffaqiyatli tiklandi' };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Restore employee error:', error);
      throw new InternalServerErrorException(
        'Xodimni tiklashda xatolik yuz berdi',
      );
    }
  }

  private buildPagination(page: number) {
    const limit = PAGE_LIMIT;
    const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
    return { limit, offset };
  }

  private buildPageResponse<T>(
    records: T[],
    total_count: number,
    page: number,
  ) {
    return {
      status: 200,
      data: {
        records,
        pagination: {
          currentPage: Math.max(Number(page) || 1, 1),
          total_pages: Math.ceil(total_count / PAGE_LIMIT),
          total_count,
        },
      },
    };
  }
}
