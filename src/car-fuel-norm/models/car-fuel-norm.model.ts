import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Car } from '../../cars/models/cars.models';
import { Fuel } from '../../fuels/models/fuels.models';
import { CarFuelNormHistory } from '../../car-fuel-norm-history/models/car-fuel-norm-history.model';

interface CarFuelNormAttr {
  car_id: string;
  fuel_id: string;
  norm_per_100km: number;
  initial_balance: number;
  current_balance: number;
  is_deleted?: boolean;
}

const decimalGetter = (field: string) =>
  function (this: any) {
    const raw = this.getDataValue(field);
    return raw === null || raw === undefined ? raw : parseFloat(raw);
  };

@Table({
  tableName: 'car_fuel_norms',
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
      fields: ['car_id', 'fuel_id'],
      where: { is_deleted: false },
      name: 'uq_car_fuel_norm_active',
    },
  ],
})
export class CarFuelNorm extends Model<CarFuelNorm, CarFuelNormAttr> {
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

  @BelongsTo(() => Car, {
    foreignKey: 'car_id',
    as: 'car',
  })
  declare car: Car;

  @ForeignKey(() => Fuel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare fuel_id: string;

  @BelongsTo(() => Fuel, {
    foreignKey: 'fuel_id',
    as: 'fuel',
  })
  declare fuel: Fuel;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare norm_per_100km: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    get: decimalGetter('initial_balance'),
  })
  declare initial_balance: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    get: decimalGetter('current_balance'),
  })
  declare current_balance: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_deleted: boolean;

  @HasMany(() => CarFuelNormHistory, {
    foreignKey: 'car_fuel_norm_id',
    as: 'history',
  })
  declare history: CarFuelNormHistory[];
}