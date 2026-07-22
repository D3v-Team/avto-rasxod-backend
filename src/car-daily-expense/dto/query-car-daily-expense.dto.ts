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
    description: 'Filter by car ID',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  car_id?: string;

  @ApiProperty({
    description: 'Filter by fuel ID',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fuel_id?: string;

  @ApiProperty({
    description: 'Date from',
    example: '2024-01-01',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiProperty({
    description: 'Date to',
    example: '2024-01-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
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
  @IsBoolean()
  @ApiProperty({ required: false, type: Boolean })
  is_holiday?: boolean;

  @ApiProperty({
    description: 'Search by car name or plate number',
    example: 'Toyota',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Sort by field',
    example: 'date',
    enum: ['date', 'sequence_no', 'mileage', 'fuel_expence', 'balance_after'],
    default: 'date',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['date', 'sequence_no', 'mileage', 'fuel_expence', 'balance_after'])
  sortBy?: string = 'date';

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
}
