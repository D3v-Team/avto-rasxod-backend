import { Column, DataType, Model, Table } from 'sequelize-typescript';

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
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare price: number;
}
