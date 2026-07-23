import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryFuelDto {
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
    description: "Yoqilg'i nomi bo'yicha qidiruv",
    example: 'AI',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Qidiruv matni matn ko'rinishida bo'lishi kerak" })
  search?: string;

  @ApiProperty({
    description: 'Saralash ustuni',
    example: 'createdAt',
    enum: ['name', 'price', 'createdAt'],
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Saralash ustuni matn ko'rinishida bo'lishi kerak" })
  @IsIn(['name', 'price', 'createdAt'], {
    message: "Saralash ustuni quyidagilardan biri bo'lishi kerak: name, price, createdAt",
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
}
