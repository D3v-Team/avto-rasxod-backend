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

interface CarFuelNormAttr {
  car_id: string;
  fuel_id: string;
  norm_per_100km: number;
  current_balance: number;
}

@Table({
  tableName: 'car_fuel_norms',
  indexes: [
    {
      unique: true,
      fields: ['car_id', 'fuel_id'],
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
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare norm_per_100km: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  declare current_balance: number;
}
