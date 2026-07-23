import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: "Foydalanuvchi to'liq ismi",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "To'liq ism matn ko'rinishida bo'lishi kerak" })
  full_name?: string;

  @ApiProperty({
    example: 'john',
    description: 'Foydalanuvchi username manzili',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Username matn ko'rinishida bo'lishi kerak" })
  username?: string;
}
