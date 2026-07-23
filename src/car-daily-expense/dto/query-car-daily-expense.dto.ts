import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  IsIn,
  IsDateString,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryCarDailyExpenseDto {
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
    description: 'Boshlang‘ich sana (YYYY-MM-DD)',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "Boshlang'ich sana to'g'ri sana formatida bo'lishi kerak (YYYY-MM-DD)" })
  date_from?: string;

  @ApiProperty({
    description: 'Yakuniy sana (YYYY-MM-DD)',
    example: '2024-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: "Yakuniy sana to'g'ri sana formatida bo'lishi kerak (YYYY-MM-DD)" })
  date_to?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: "is_holiday true yoki false qiymatida bo'lishi kerak" })
  @ApiProperty({ required: false, type: Boolean })
  is_holiday?: boolean;

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
    example: 'date',
    enum: ['date', 'sequence_no', 'mileage', 'fuel_expence', 'balance_after'],
    default: 'date',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Saralash ustuni matn ko'rinishida bo'lishi kerak" })
  @IsIn(['date', 'sequence_no', 'mileage', 'fuel_expence', 'balance_after'], {
    message: "Saralash ustuni quyidagilardan biri bo'lishi kerak: date, sequence_no, mileage, fuel_expence, balance_after",
  })
  sortBy?: string = 'date';

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
}
