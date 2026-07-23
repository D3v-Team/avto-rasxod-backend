import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, Matches, IsNotEmpty } from 'class-validator';

export class CarMonthlyReportQueryDto {
  @ApiProperty({
    description: 'Mashina ID kaliti',
    example: 'uuid',
  })
  @IsUUID('4', { message: "Mashina ID si to'g'ri UUID formatida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Mashina ID si kiritilishi shart' })
  car_id: string;

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
    description: "Yoqilg'i turi ID kaliti bo'yicha filter (ixtiyoriy)",
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: "Yoqilg'i turi ID si to'g'ri UUID formatida bo'lishi kerak" })
  fuel_id?: string;
}
