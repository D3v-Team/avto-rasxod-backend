import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class YearlyStatisticsQueryDto {
  @ApiProperty({ example: 2026, description: 'Yil (2000-2100)' })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @ApiProperty({ required: false, description: 'Mashina ID' })
  @IsOptional()
  @IsUUID()
  car_id?: string;

  @ApiProperty({ required: false, description: 'Mashina aktivlik holati' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;
}
