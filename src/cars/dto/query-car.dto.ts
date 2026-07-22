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
    description: 'Page number',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    description: 'Items per page',
    example: 10,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Search by name or plate number',
    example: 'Toyota',
    required: false,
  })
  @IsOptional()
  @IsString()
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
  @IsBoolean()
  @ApiProperty({ required: false })
  is_active?: boolean;

  @ApiProperty({
    description: 'Filter by responsible employee ID',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  responsible_employee_id?: string;

  @ApiProperty({
    description: 'Filter by driver ID',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @ApiProperty({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['name', 'plate_number', 'createdAt'],
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['name', 'plate_number', 'createdAt'])
  sortBy?: string = 'createdAt';

  @ApiProperty({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
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
  @IsBoolean()
  @ApiProperty({ required: false })
  is_deleted?: boolean;
}
