import { Column, DataType, Model, Table } from 'sequelize-typescript';
interface EmployeeAttr {
  role: string;
  full_name: string;
  phone: string;
}

@Table({ tableName: 'employees' })
export class Employee extends Model<Employee, EmployeeAttr> {
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
  declare role: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare full_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare phone: string;
}
