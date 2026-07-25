import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Car } from '../../cars/models/cars.models';
import { Fuel } from '../../fuels/models/fuels.models';
import { Employee } from '../../employees/models/employee.model';

interface CarDailyExpenseAttr {
  car_id: string;
  fuel_id: string;
  date: string;
  sequence_no: number;
  odometer_start: number;
  odometer_end: number;
  mileage: number;
  received_amount?: number;
  fuel_expence: number;
  fuel_price_at_time: number;
  balance_after: number;
  is_holiday: boolean;
  note?: string;
  responsible_employee_id_at_time: string | null;
  driver_id_at_time: string | null;
  norm_per_100km_at_time: number;
}

@Table({
  tableName: 'car_daily_expenses',
  indexes: [
    {
      unique: true,
      fields: ['car_id', 'sequence_no'],
      name: 'uq_car_daily_expense_car_sequence',
    },
    {
      unique: false,
      fields: ['car_id', 'fuel_id', 'date'],
    },
  ],
})
export class CarDailyExpense extends Model<
  CarDailyExpense,
  CarDailyExpenseAttr
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => Car)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare car_id: string;

  @BelongsTo(() => Car)
  declare car: Car;

  @ForeignKey(() => Fuel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare fuel_id: string;

  @BelongsTo(() => Fuel)
  declare fuel: Fuel;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare date: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare sequence_no: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare odometer_start: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare odometer_end: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare mileage: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: true,
    defaultValue: 0,
  })
  declare received_amount?: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare fuel_expence: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare fuel_price_at_time: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare balance_after: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_holiday: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare note?: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  declare norm_per_100km_at_time: number;


  // O'sha vaqtdagi mas'ul xodim
  @ForeignKey(() => Employee)
  @Column({ type: DataType.UUID, allowNull: true })
  declare responsible_employee_id_at_time: string | null;

  @BelongsTo(() => Employee, {
    foreignKey: 'responsible_employee_id_at_time',
    as: 'responsible_employee_at_time',
  })
  declare responsible_employee_at_time: Employee | null;

  // O'sha vaqtdagi haydovchi
  @ForeignKey(() => Employee)
  @Column({ type: DataType.UUID, allowNull: true })
  declare driver_id_at_time: string | null;

  @BelongsTo(() => Employee, {
    foreignKey: 'driver_id_at_time',
    as: 'driver_at_time',
  })
  declare driver_at_time: Employee | null;
}
