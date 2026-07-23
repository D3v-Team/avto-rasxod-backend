import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class CarMonthlyReportExcelQueryDto {
  @ApiProperty({
    description: 'Mashina ID kaliti',
    example: 'uuid',
  })
  @IsUUID('4', { message: "Mashina ID si to'g'ri UUID formatida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Mashina ID si kiritilishi shart' })
  car_id: string;

  @ApiProperty({
    description: "Yoqilg'i turi ID kaliti",
    example: 'uuid',
  })
  @IsUUID('4', { message: "Yoqilg'i turi ID si to'g'ri UUID formatida bo'lishi kerak" })
  @IsOptional()
  fuel_id?: string;

  @ApiProperty({
    description: 'Yil (2000-2100)',
    example: 2026,
  })
  @Type(() => Number)
  @IsInt({ message: "Yil butun son bo'lishi kerak" })
  @IsNotEmpty({ message: 'Yil kiritilishi shart' })
  @Min(2000, { message: "Yil 2000 dan katta bo'lishi kerak" })
  @Max(2100, { message: "Yil 2100 dan kichik bo'lishi kerak" })
  year: number;

  @ApiProperty({
    description: 'Oy (1-12)',
    example: 6,
  })
  @Type(() => Number)
  @IsInt({ message: "Oy butun son bo'lishi kerak" })
  @IsNotEmpty({ message: 'Oy kiritilishi shart' })
  @Min(1, { message: "Oy 1 dan 12 gacha bo'lishi kerak" })
  @Max(12, { message: "Oy 1 dan 12 gacha bo'lishi kerak" })
  month: number;
}
