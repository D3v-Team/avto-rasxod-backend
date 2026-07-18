import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'Aliyev Ali' })
  @IsString({ message: "F.I.O. matn (string) bo'lishi kerak" })
  @IsNotEmpty({ message: 'F.I.O. kiritilishi shart' })
  full_name: string;

  @ApiProperty({ example: '+998901234567' })
  @IsString({ message: "Telefon raqami matn (string) bo'lishi kerak" })
  @IsNotEmpty({ message: 'Telefon raqami kiritilishi shart' })
  phone: string;

  @ApiProperty({ example: 'Sotuvchi' })
  @IsString({ message: "Lavozim (role) matn (string) bo'lishi kerak" })
  @IsNotEmpty({ message: 'Lavozim (role) kiritilishi shart' })
  role: string;
}
