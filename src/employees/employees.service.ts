import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Employee } from './models/employee.model';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeRole } from '../common/enums/employee-role.enum';
import { Op, WhereOptions } from 'sequelize';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectModel(Employee) private readonly employeeRepo: typeof Employee,
  ) {}

  async create(dto: CreateEmployeeDto) {
    await this.employeeRepo.create({ ...dto });
    return { message: "Xodim muvaffaqiyatli qo'shildi" };
  }

  async findAll() {
    return this.employeeRepo.findAll();
  }

  async findOne(id: string) {
    const employee = await this.employeeRepo.findByPk(id);
    if (!employee) {
      throw new NotFoundException(`ID ${id} bo'yicha xodim topilmadi`);
    }
    return employee;
  }

  async filter({
    role,
    searchTerm,
    page = 1,
    limit = 10,
  }: {
    role?: EmployeeRole;
    searchTerm?: string;
    page?: number;
    limit?: number;
  }) {
    const where: WhereOptions = {};
    if (role) {
      where.role = role;
    }
    if (searchTerm) {
      where.$or = [
        { full_name: { [Op.iLike]: `%${searchTerm}%` } },
        { phone: { [Op.iLike]: `%${searchTerm}%` } },
      ];
    }
    return this.employeeRepo.findAll({
      where,
      limit,
      offset: (page - 1) * limit,
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    const employee = await this.findOne(id);
    await employee.update(dto);
    return { message: 'Xodim muvaffaqiyatli yangilandi' };
  }

  async remove(id: string) {
    const employee = await this.findOne(id);
    await employee.destroy();
    return { message: "Xodim muvaffaqiyatli o'chirildi" };
  }
}
