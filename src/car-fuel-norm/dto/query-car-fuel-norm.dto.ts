import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  IsIn,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryCarFuelNormDto {
  @ApiProperty({
    description: 'Sahifa raqami',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Sahifa raqami raqam bo'lishi kerak" })
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
  @IsNumber({}, { message: "Limit raqam bo'lishi kerak" })
  @Min(1, { message: "Limit kamida 1 bo'lishi kerak" })
  @Max(100, { message: "Limit ko'pi bilan 100 bo'lishi kerak" })
  limit?: number = 10;

  @ApiProperty({
    description: "Mashina ID kaliti bo'yicha filter",
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: "Mashina ID si to'g'ri UUID formatida bo'lishi kerak" })
  car_id?: string;

  @ApiProperty({
    description: "Yoqilg'i turi ID kaliti bo'yicha filter",
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', { message: "Yoqilg'i turi ID si to'g'ri UUID formatida bo'lishi kerak" })
  fuel_id?: string;

  @ApiProperty({
    description: 'Mashina nomi yoki davlat raqami bo‘yicha qidiruv',
    example: 'Toyota',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Qidiruv matni matn ko'rinishida bo'lishi kerak" })
  search?: string;

  @ApiProperty({
    description: 'Saralash ustuni',
    example: 'createdAt',
    enum: ['norm_per_100km', 'current_balance', 'createdAt'],
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Saralash ustuni matn ko'rinishida bo'lishi kerak" })
  @IsIn(['norm_per_100km', 'current_balance', 'createdAt'], {
    message: "Saralash ustuni quyidagilardan biri bo'lishi kerak: norm_per_100km, current_balance, createdAt",
  })
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Saralash yo‘nalishi',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Saralash yo'nalishi matn ko'rinishida bo'lishi kerak" })
  @IsIn(['ASC', 'DESC'], {
    message: "Saralash yo'nalishi ASC yoki DESC bo'lishi kerak",
  })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({
    required: false,
    description:
      "true — faqat o'chirilgan yozuvlarni ko'rsatadi, false — faqat " +
      "aktiv (o'chirilmagan) yozuvlarni ko'rsatadi, " +
      'berilmasa faqat aktiv yozuvlar qaytadi',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: "is_deleted true yoki false qiymatida bo'lishi kerak" })
  is_deleted?: boolean;
}
