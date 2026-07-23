import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { EmployeeRole } from '../../common/enums/employee-role.enum';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Aliyev Ali', description: "Xodimning to'liq ismi" })
  @IsString({ message: "To'liq ism matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: "To'liq ism kiritilishi shart" })
  full_name: string;

  @ApiProperty({ example: '+998901234567', description: 'Telefon raqami' })
  @IsString({ message: "Telefon raqami matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Telefon raqami kiritilishi shart' })
  phone: string;

  @ApiProperty({
    enum: EmployeeRole,
    example: EmployeeRole.DRIVER,
    description: 'Xodim roli',
  })
  @IsEnum(EmployeeRole, {
    message: "Xodim roli quyidagilardan biri bo'lishi kerak: DRIVER, RESPONSIBLE",
  })
  role: EmployeeRole;
}
