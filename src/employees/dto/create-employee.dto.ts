import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EmployeeRole } from '../../common/enums/employee-role.enum';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Aliyev Ali' })
  @IsString({ message: "F.I.O. matn (string) bo'lishi kerak" })
  @IsNotEmpty({ message: 'F.I.O. kiritilishi shart' })
  full_name: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString({ message: "Telefon raqami matn (string) bo'lishi kerak" })
  @IsNotEmpty({ message: 'Telefon raqami kiritilishi shart' })
  phone: string;

  @ApiProperty({
    enum: EmployeeRole,
    example: EmployeeRole.DRIVER,
    description: 'Foydalanuvchi roli',
  })
  @IsEnum(EmployeeRole, {
    message: 'Role noto‘g‘ri kiritilgan',
  })
  role: EmployeeRole;
}
