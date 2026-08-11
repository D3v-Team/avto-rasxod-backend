import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Car } from '../../cars/models/cars.models';
import { Employee } from '../../employees/models/employee.model';

interface CarSparePartsExpenseAttr {
  car_id: string;
  responsible_employee_id_at_time: string | null;
  driver_id_at_time: string | null;
  part_name: string;
  unit: string;
  quantity: number;
  payment_type: string;
  price: number;
  total_price: number;
  note?: string;
  date: string;
}

const decimalGetter = (field: string) =>
  function (this: any) {
    const raw = this.getDataValue(field);
    return raw === null || raw === undefined ? raw : parseFloat(raw);
  };

@Table({
  tableName: 'car_spare_parts_expenses',
  indexes: [
    {
      unique: false,
      fields: ['car_id', 'date'],
      name: 'idx_car_spare_parts_expense_car_date',
    },
  ],
})
export class CarSparePartsExpense extends Model<
  CarSparePartsExpense,
  CarSparePartsExpenseAttr
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

  @BelongsTo(() => Car, {
    foreignKey: 'car_id',
    as: 'car',
  })
  declare car: Car;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare responsible_employee_id_at_time: string | null;

  @BelongsTo(() => Employee, {
    foreignKey: 'responsible_employee_id_at_time',
    as: 'responsible_employee',
    onDelete: 'SET NULL',
  })
  declare responsible_employee: Employee | null;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare driver_id_at_time: string | null;

  @BelongsTo(() => Employee, {
    foreignKey: 'driver_id_at_time',
    as: 'driver',
    onDelete: 'SET NULL',
  })
  declare driver: Employee | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare part_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare unit: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    get: decimalGetter('quantity'),
  })
  declare quantity: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare payment_type: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    get: decimalGetter('price'),
  })
  declare price: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    get: decimalGetter('total_price'),
  })
  declare total_price: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare note?: string;

  @Column({
    type: DataType.DATEONLY,
    allowNull: false,
  })
  declare date: string;
}
