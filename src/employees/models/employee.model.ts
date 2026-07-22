import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { EmployeeRole } from '../../common/enums/employee-role.enum';
interface EmployeeAttr {
  role: EmployeeRole;
  full_name: string;
  phone: string;
  is_deleted?: boolean;
}

@Table({
  tableName: 'employees',
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
})
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

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_deleted: boolean;
}
