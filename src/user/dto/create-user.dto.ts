import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Foydalanuvchi to‘liq ismi',
  })
  @IsString({ message: 'full_name matn (string) bo‘lishi kerak' })
  @IsNotEmpty({ message: 'full_name bo‘sh bo‘lishi mumkin emas' })
  full_name: string;

  @ApiProperty({
    example: 'john',
    description: 'Foydalanuvchi username manzili',
  })
  @IsNotEmpty({ message: 'username kiritilishi shart' })
  username: string;

  @ApiProperty({
    example: 'password123',
    description: 'Foydalanuvchi paroli (kamida 6 ta belgi)',
  })
  @IsString({ message: 'password matn (string) bo‘lishi kerak' })
  @IsNotEmpty({ message: 'password kiritilishi shart' })
  @MinLength(6, {
    message: 'password kamida 6 ta belgidan iborat bo‘lishi kerak',
  })
  password: string;
}
