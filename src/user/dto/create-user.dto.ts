import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: "Foydalanuvchi to'liq ismi",
  })
  @IsString({ message: "To'liq ism matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: "To'liq ism kiritilishi shart" })
  full_name: string;

  @ApiProperty({
    example: 'john',
    description: 'Foydalanuvchi username manzili',
  })
  @IsString({ message: "Username matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Username kiritilishi shart' })
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'Foydalanuvchi paroli (kamida 6 ta belgi)',
  })
  @IsString({ message: "Parol matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Parol kiritilishi shart' })
  @MinLength(6, {
    message: "Parol kamida 6 ta belgidan iborat bo'lishi kerak",
  })
  password: string;
}
