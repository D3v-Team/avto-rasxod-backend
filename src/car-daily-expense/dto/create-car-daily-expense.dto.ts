import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsString,
  IsOptional,
  IsNotEmpty,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCarDailyExpenseDto {
  @ApiProperty({
    description: 'Car ID',
    example: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  car_id: string;

  @ApiProperty({
    description: 'Fuel ID',
    example: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  fuel_id: string;

  @ApiProperty({
    description: 'Date',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({
    description: "Kun oxiridagi spidometr ko'rsatkichi",
    example: 15000,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  odometer_end: number;

  @ApiProperty({
    description: "Bugun quyilgan yoqilg'i miqdori",
    example: 20,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  received_amount: number;

  @ApiProperty({
    description: 'Bayram kuni',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return false;
  })
  @IsBoolean()
  is_holiday?: boolean = false;

  @ApiProperty({
    description: 'Note',
    example: 'Regular trip',
    maxLength: 500,
    required: false,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  note?: string;
}
