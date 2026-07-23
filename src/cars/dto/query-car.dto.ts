import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryCarDto {
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
    description: 'Mashina nomi yoki davlat raqami bo‘yicha qidiruv',
    example: 'Toyota',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Qidiruv matni matn ko'rinishida bo'lishi kerak" })
  search?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: "is_active true yoki false qiymatida bo'lishi kerak" })
  @ApiProperty({ required: false })
  is_active?: boolean;

  @ApiProperty({
    description: "Mas'ul xodim ID kaliti bo'yicha filter",
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', {
    message: "Mas'ul xodim ID si to'g'ri UUID formatida bo'lishi kerak",
  })
  responsible_employee_id?: string;

  @ApiProperty({
    description: "Haydovchi ID kaliti bo'yicha filter",
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', {
    message: "Haydovchi ID si to'g'ri UUID formatida bo'lishi kerak",
  })
  driver_id?: string;

  @ApiProperty({
    description: 'Saralash ustuni',
    example: 'createdAt',
    enum: ['name', 'plate_number', 'createdAt'],
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Saralash ustuni matn ko'rinishida bo'lishi kerak" })
  @IsIn(['name', 'plate_number', 'createdAt'], {
    message: "Saralash ustuni quyidagilardan biri bo'lishi kerak: name, plate_number, createdAt",
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
  @ApiProperty({ required: false })
  is_deleted?: boolean;
}
