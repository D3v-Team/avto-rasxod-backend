import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Employee } from '../../employees/models/employee.model';

interface CarAttr {
  name: string;
  plate_number: string;
  responsible_employee_id?: string;
  driver_id?: string;
  speedometer: number;
  last_sequence_no: number;
  is_active?: boolean;
}

@Table({ tableName: 'cars' })
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
    unique: true,
  })
  declare plate_number: string;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare responsible_employee_id?: string;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare driver_id?: string;

  @BelongsTo(() => Employee, {
    foreignKey: 'responsible_employee_id',
    as: 'responsible_employee',
  })
  declare responsible_employee?: Employee;

  @BelongsTo(() => Employee, {
    foreignKey: 'driver_id',
    as: 'driver',
  })
  declare driver?: Employee;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
    defaultValue: 0,
  })
  declare speedometer: number;

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
}
