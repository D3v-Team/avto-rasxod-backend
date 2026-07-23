import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class YearlyStatisticsQueryDto {
  @ApiProperty({ example: 2026, description: 'Yil (2000-2100)' })
  @Type(() => Number)
  @IsInt({ message: "Yil butun son bo'lishi kerak" })
  @IsNotEmpty({ message: 'Yil kiritilishi shart' })
  @Min(2000, { message: "Yil kamida 2000 bo'lishi kerak" })
  @Max(2100, { message: "Yil ko'pi bilan 2100 bo'lishi kerak" })
  year: number;

  @ApiProperty({ required: false, description: "Mashina ID kaliti bo'yicha filter" })
  @IsOptional()
  @IsUUID('4', { message: "Mashina ID si to'g'ri UUID formatida bo'lishi kerak" })
  car_id?: string;

  @ApiProperty({ required: false, description: 'Mashina faol yoki faol emasligi bo‘yicha filter' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: "is_active true yoki false qiymatida bo'lishi kerak" })
  is_active?: boolean;
}
