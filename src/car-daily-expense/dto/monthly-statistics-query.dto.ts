import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class MonthlyStatisticsQueryDto {
  @ApiProperty({
    description: 'Month (YYYY-MM format)',
    example: '2026-06',
  })
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'Month must be in YYYY-MM format',
  })
  month: string;

  @ApiProperty({
    description: 'Filter by active status',
    example: true,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }): boolean | string => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({
    description: 'Filter by car ID (optional)',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  car_id?: string;
}
