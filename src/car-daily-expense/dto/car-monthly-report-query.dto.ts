import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsOptional, Matches } from 'class-validator';

export class CarMonthlyReportQueryDto {
  @ApiProperty({
    description: 'Car ID',
    example: 'uuid',
  })
  @IsUUID()
  car_id: string;

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
    description: 'Filter by fuel ID (optional)',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  fuel_id?: string;
}
