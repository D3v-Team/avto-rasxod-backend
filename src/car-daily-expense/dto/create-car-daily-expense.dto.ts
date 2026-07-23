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
    description: 'Sana (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsDateString({}, { message: "Sana to'g'ri formatda bo'lishi kerak (YYYY-MM-DD)" })
  @IsNotEmpty({ message: 'Sana kiritilishi shart' })
  date: string;

  @ApiProperty({
    description: "Kun oxiridagi spidometr ko'rsatkichi",
    example: 15000,
    minimum: 0,
  })
  @IsNumber({}, { message: "Kun oxiridagi spidometr ko'rsatkichi raqam bo'lishi kerak" })
  @Min(0, { message: "Spidometr ko'rsatkichi kamida 0 bo'lishi kerak" })
  odometer_end: number;

  @ApiProperty({
    description: "Bugun quyilgan yoqilg'i miqdori",
    example: 20,
    minimum: 0,
  })
  @IsNumber({}, { message: "Quyilgan yoqilg'i miqdori raqam bo'lishi kerak" })
  @Min(0, { message: "Quyilgan yoqilg'i miqdori kamida 0 bo'lishi kerak" })
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
  @IsBoolean({ message: "is_holiday true yoki false qiymatida bo'lishi kerak" })
  is_holiday?: boolean = false;

  @ApiProperty({
    description: 'Qo‘shimcha izoh',
    example: 'Xizmat safari',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Izoh matn ko'rinishida bo'lishi kerak" })
  @MaxLength(500, { message: "Izoh 500 belgidan oshmasligi kerak" })
  note?: string;
}
