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
  IsPositive,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateCarDailyExpenseDto {
  @ApiProperty({
    description: 'Mashina ID kaliti',
    example: 'uuid',
  })
  @IsUUID('4', {
    message: "Mashina ID si to'g'ri UUID formatida bo'lishi kerak",
  })
  @IsNotEmpty({ message: 'Mashina ID si kiritilishi shart' })
  car_id: string;

  @ApiProperty({
    description: "Yoqilg'i turi ID kaliti",
    example: 'uuid',
  })
  @IsUUID('4', {
    message: "Yoqilg'i turi ID si to'g'ri UUID formatida bo'lishi kerak",
  })
  @IsNotEmpty({ message: "Yoqilg'i turi ID si kiritilishi shart" })
  fuel_id: string;

  @ApiProperty({
    description: 'Sana (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  @IsDateString(
    {},
    { message: "Sana to'g'ri formatda bo'lishi kerak (YYYY-MM-DD)" },
  )
  @IsNotEmpty({ message: 'Sana kiritilishi shart' })
  date: string;

  @ApiProperty({
    description: "Bosib o'tilgan masofa (km)",
    example: 80,
    minimum: 0,
  })
  @IsNotEmpty({ message: "Bosib o'tilgan masofa kiritilishi shart" })
  @Type(() => Number)
  @IsNumber({}, { message: "Bosib o'tilgan masofa raqam bo'lishi kerak" })
  @Min(0, { message: "Bosib o'tilgan masofa manfiy bo'lishi mumkin emas" })
  mileage: number;

  @ApiProperty({
    required: false,
    description:
      "Agar bugun yoqilg'i quyilmagan bo'lsa, kiritmasa ham bo'ladi (0 deb qabul qilinadi)",
    example: 20,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: "Quyilgan yoqilg'i miqdori raqam bo'lishi kerak" })
  @Min(0, { message: "Quyilgan yoqilg'i miqdori manfiy bo'lishi mumkin emas" })
  received_amount?: number;

  @ApiProperty({
    required: false,
    description:
      "Shu xaridning aniq narxi (received_amount > 0 bo'lsa MAJBURIY)",
    example: 15000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Yoqilg'i narxi raqam bo'lishi kerak" })
  @IsPositive({ message: "Yoqilg'i narxi musbat son bo'lishi kerak" })
  fuel_price_at_time?: number;

  @ApiProperty({
    description: 'Bayram kuni',
    example: false,
    default: false,
    required: false,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
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
  @MaxLength(500, { message: 'Izoh 500 belgidan oshmasligi kerak' })
  note?: string;
}
