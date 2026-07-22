import { Column, DataType, Model, Table } from 'sequelize-typescript';
import { UserRole } from '../../common/enums/user-role.enum';

interface UserAttr {
  full_name: string;
  username: string;
  hashed_password: string;
  hashed_refresh_token?: string | null;
  refresh_token_jti?: string | null;
  role: UserRole;
  is_deleted?: boolean;
}

@Table({
  tableName: 'users',
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
      fields: ['username'],
      where: { is_deleted: false },
      name: 'uq_users_username_active',
    },
  ],
})
export class User extends Model<User, UserAttr> {
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
  declare full_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare username: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare hashed_password: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare hashed_refresh_token?: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare refresh_token_jti?: string | null;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    allowNull: false,
  })
  declare role: UserRole;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  declare is_deleted: boolean;
}
