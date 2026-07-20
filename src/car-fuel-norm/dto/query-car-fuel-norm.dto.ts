import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsUUID,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QueryCarFuelNormDto {
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
    description: 'Search by car name or plate number',
    example: 'Toyota',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['norm_per_100km', 'current_balance', 'createdAt'],
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['norm_per_100km', 'current_balance', 'createdAt'])
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
}
