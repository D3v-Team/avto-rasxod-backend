import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { EmployeeRole } from '../../common/enums/employee-role.enum';
interface EmployeeAttr {
  role: EmployeeRole;
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
    type: DataType.ENUM(...Object.values(EmployeeRole)),
    allowNull: false,
  })
  declare role: EmployeeRole;

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
