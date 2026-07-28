import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { EmployeeRole } from '../../common/enums/employee-role.enum';
import { CarDailyExpense } from '../../car-daily-expense/models/car-daily-expense.model';
import { Car } from '../../cars/models/cars.models';
import { CarSparePartsExpense } from '../../car-spare-parts-expense/models/car-spare-parts-expense.model';
interface EmployeeAttr {
  role: EmployeeRole;
  full_name: string;
  phone: string;
  is_deleted?: boolean;
}

@Table({
  tableName: 'employees',
  defaultScope: {
    where: { is_deleted: false },
  },
  scopes: {
    withDeleted: {
      where: {},
    },
    onlyDeleted: {
      where: { is_deleted: true },
    },
  },
})
export class Employee extends Model<Employee, EmployeeAttr> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.ENUM(...Object.values(EmployeeRole)),
    allowNull: false,
  })
  declare role: EmployeeRole;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare full_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare phone: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_deleted: boolean;

  // ── Hozirgi holat ──
  @HasMany(() => Car, {
    foreignKey: 'responsible_employee_id',
    as: 'managed_cars',
  })
  declare managed_cars: Car[];

  @HasMany(() => Car, {
    foreignKey: 'driver_id',
    as: 'driven_cars',
  })
  declare driven_cars: Car[];

  // ── Tarixiy (snapshot) yozuvlar ──
  @HasMany(() => CarSparePartsExpense, {
    foreignKey: 'responsible_employee_id_at_time',
    as: 'spare_parts_responsible_employees_at_time',
  })
  declare spare_parts_responsible_employees_at_time: CarSparePartsExpense[];

  @HasMany(() => CarSparePartsExpense, {
    foreignKey: 'driver_id_at_time',
    as: 'spare_parts_drivers_at_time',
  })
  declare spare_parts_drivers_at_time: CarSparePartsExpense[];

  @HasMany(() => CarDailyExpense, {
    foreignKey: 'responsible_employee_id_at_time',
    as: 'responsible_employees_at_time',
  })
  declare responsible_employees_at_time: CarDailyExpense[];

  @HasMany(() => CarDailyExpense, {
    foreignKey: 'driver_id_at_time',
    as: 'drivers_at_time',
  })
  declare drivers_at_time: CarDailyExpense[];
}