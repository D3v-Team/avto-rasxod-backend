import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class OrganizationMonthlyReportQueryDto {
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

  @ApiProperty({
    description: 'Sahifa raqami',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Sahifa raqami butun son bo'lishi kerak" })
  @Min(1, { message: "Sahifa raqami kamida 1 bo'lishi kerak" })
  page?: number = 1;

  @ApiProperty({
    description: 'Har bir sahifadagi elementlar soni',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit butun son bo'lishi kerak" })
  @Min(1, { message: "Limit kamida 1 bo'lishi kerak" })
  @Max(100, { message: "Limit ko'pi bilan 100 bo'lishi kerak" })
  limit?: number = 10;

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
    description: 'Mashina nomi yoki davlat raqami bo‘yicha qidiruv',
    example: 'Toyota',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Qidiruv matni matn ko'rinishida bo'lishi kerak" })
  search?: string;
}
