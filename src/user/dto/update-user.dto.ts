import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateUserDto {
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
}
