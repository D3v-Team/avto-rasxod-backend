import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { CarDailyExpense } from '../../car-fuel-daily-expense/models/car-fuel-daily-expense.model';
import { CarFuelNorm } from '../../car-fuel-norm/models/car-fuel-norm.model';
import { Car } from '../../cars/models/cars.models';

interface FuelAttr {
  name: string;
  unit: string;
}

@Table({ tableName: 'fuels' })
export class Fuel extends Model<Fuel, FuelAttr> {
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
  declare unit: string;

  @HasMany(() => CarDailyExpense, {
    foreignKey: 'fuel_id',
    as: 'car_daily_expenses',
  })
  declare car_daily_expenses: CarDailyExpense[];

  @HasMany(() => CarFuelNorm, {
    foreignKey: 'fuel_id',
    as: 'car_fuel_norms',
  })
  declare car_fuel_norms: CarFuelNorm[];
}
