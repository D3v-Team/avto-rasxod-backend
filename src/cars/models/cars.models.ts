import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Employee } from '../../employees/models/employee.model';
import { CarFuelNorm } from '../../car-fuel-norm/models/car-fuel-norm.model';
import { CarDailyExpense } from '../../car-fuel-daily-expense/models/car-fuel-daily-expense.model';
import { CarSparePartsExpense } from '../../car-spare-parts-expense/models/car-spare-parts-expense.model';

interface CarAttr {
  name: string;
  plate_number: string;
  responsible_employee_id?: string | null;
  driver_id?: string | null;
  initial_odometer: number;
  odometer: number;
  last_sequence_no: number;
  is_active?: boolean;
  is_deleted?: boolean;
}

@Table({
  tableName: 'cars',
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
  indexes: [
    {
      unique: true,
      fields: ['plate_number'],
      where: { is_deleted: false },
      name: 'uq_cars_plate_number_active',
    },
  ],
})
export class Car extends Model<Car, CarAttr> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare plate_number: string;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare responsible_employee_id?: string | null;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare driver_id?: string | null;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  declare initial_odometer: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  declare odometer: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  declare last_sequence_no: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare is_active: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_deleted: boolean;

  // ── Assotsiatsiyalar ──
  @BelongsTo(() => Employee, {
    foreignKey: 'responsible_employee_id',
    as: 'responsible_employee',
  })
  declare responsible_employee?: Employee | null;

  @BelongsTo(() => Employee, {
    foreignKey: 'driver_id',
    as: 'driver',
  })
  declare driver?: Employee | null;

  @HasMany(() => CarFuelNorm, {
    foreignKey: 'car_id',
    as: 'car_fuel_norms',
  })
  declare car_fuel_norms: CarFuelNorm[];

  @HasMany(() => CarDailyExpense, {
    foreignKey: 'car_id',
    as: 'car_daily_expenses',
  })
  declare car_daily_expenses: CarDailyExpense[];

  @HasMany(() => CarSparePartsExpense, {
    foreignKey: 'car_id',
    as: 'car_spare_parts_expenses',
  })
  declare car_spare_parts_expenses: CarSparePartsExpense[];
}
