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
    description: 'Mashina ID kaliti',
    example: 'uuid',
  })
  @IsUUID('4', { message: "Mashina ID si to'g'ri UUID formatida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Mashina ID si kiritilishi shart' })
  car_id: string;

  @ApiProperty({
    description: "Yoqilg'i turi ID kaliti",
    example: 'uuid',
  })
  @IsUUID('4', { message: "Yoqilg'i turi ID si to'g'ri UUID formatida bo'lishi kerak" })
  @IsNotEmpty({ message: "Yoqilg'i turi ID si kiritilishi shart" })
  fuel_id: string;

  @ApiProperty({
    description: '100 km uchun sarf normasi',
    example: 8.5,
  })
  @IsNumber({}, { message: "100 km ga norma me'yori raqam bo'lishi kerak" })
  @IsPositive({ message: "100 km ga norma me'yori musbat son bo'lishi kerak" })
  norm_per_100km: number;

  @ApiProperty({
    description: 'Joriy yoqilg‘i balansi',
    example: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Joriy balans raqam bo'lishi kerak" })
  current_balance?: number = 0;
}
