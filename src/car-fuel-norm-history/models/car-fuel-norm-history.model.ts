import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { CarFuelNorm } from '../../car-fuel-norm/models/car-fuel-norm.model';

const decimalGetter = (field: string) =>
  function (this: any) {
    const value = this.getDataValue(field);
    return value === null || value === undefined ? null : parseFloat(value);
  };

interface CarFuelNormHistoryAttr {
  car_fuel_norm_id: string;
  norm_per_100km: number;
  fuel_price_at_time: number;
  effective_from: string;
  effective_to: string | null;
}

@Table({
  tableName: 'car_fuel_norm_history',
  indexes: [
    {
      unique: false,
      fields: ['car_fuel_norm_id', 'effective_from'],
      name: 'idx_car_fuel_norm_history_lookup',
    },
  ],
})
export class CarFuelNormHistory extends Model<
  CarFuelNormHistory,
  CarFuelNormHistoryAttr
> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => CarFuelNorm)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare car_fuel_norm_id: string;

  @BelongsTo(() => CarFuelNorm, {
    foreignKey: 'car_fuel_norm_id',
    as: 'car_fuel_norm',
  })
  declare car_fuel_norm: CarFuelNorm;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare norm_per_100km: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    get: decimalGetter('fuel_price_at_time'),
  })
  declare fuel_price_at_time: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare effective_from: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare effective_to: string | null;
}
