import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  Matches,
  IsNotEmpty,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class MonthlyStatisticsQueryDto {
  @ApiProperty({
    description: 'Oy (YYYY-MM formatida)',
    example: '2026-06',
  })
  @IsString({ message: "Oy matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Oy kiritilishi shart' })
  // Month formati uchun regex tekshiruvi: YYYY-MM
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: "Oy 'YYYY-MM' formatida bo'lishi kerak (masalan: 2026-06)",
  })
  month: string;

  @ApiProperty({
    description: 'Mashina faol yoki faol emasligi bo‘yicha filter',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }): boolean | string | undefined => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: "is_active true yoki false qiymatida bo'lishi kerak" })
  is_active?: boolean;

  @ApiProperty({
    description: "Mashina ID kaliti bo'yicha filter (ixtiyoriy)",
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: "Mashina ID si to'g'ri UUID formatida bo'lishi kerak" })
  car_id?: string;
}
