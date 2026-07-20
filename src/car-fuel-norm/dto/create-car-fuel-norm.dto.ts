import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';

export class CreateCarFuelNormDto {
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
    description: 'Norm per 100km',
    example: 8.5,
  })
  @IsNumber()
  @IsPositive()
  norm_per_100km: number;

  @ApiProperty({
    description: 'Current balance',
    example: 0,
    default: 0,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  current_balance?: number = 0;
}
