import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import { CarDailyExpense } from '../../car-daily-expense/models/car-daily-expense.model';
import { CarFuelNorm } from '../../car-fuel-norm/models/car-fuel-norm.model';
import { Car } from '../../cars/models/cars.models';

interface FuelAttr {
  name: string;
  unit: string;
  price: number;
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

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    get(this: Fuel) {
      const raw = this.getDataValue('price') as unknown;
      return raw === null || raw === undefined ? raw : parseFloat(raw as string);
    },
  })
  declare price: number;

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
