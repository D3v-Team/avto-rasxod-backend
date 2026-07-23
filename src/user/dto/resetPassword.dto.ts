import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'Newpassword123',
    description: 'Yangi parol (kamida 6 ta belgi)',
  })
  @IsString({ message: "Yangi parol matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Yangi parol kiritilishi shart' })
  @MinLength(6, {
    message: "Yangi parol kamida 6 ta belgidan iborat bo'lishi kerak",
  })
  new_password: string;
}
