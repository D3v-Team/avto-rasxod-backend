import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsNumber,
  IsPositive,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsString,
} from 'class-validator';

export class CreateCarSparePartsExpenseDto {
  @ApiProperty({
    description: 'Mashina ID kaliti',
    example: 'uuid',
  })
  @IsUUID('4', { message: "Mashina ID si to'g'ri UUID formatida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Mashina ID si kiritilishi shart' })
  car_id: string;

 

  @ApiProperty({
    description: 'Ehtiyot qism nomi',
    example: 'Motor moyi',
  })
  @IsString({ message: "Ehtiyot qism nomi matn bo'lishi kerak" })
  @IsNotEmpty({ message: 'Ehtiyot qism nomi kiritilishi shart' })
  part_name: string;

  @ApiProperty({
    description: "O'lchov birligi",
    example: 'litr',
  })
  @IsString({ message: "O'lchov birligi matn bo'lishi kerak" })
  @IsNotEmpty({ message: "O'lchov birligi kiritilishi shart" })
  unit: string;

  @ApiProperty({
    description: 'Miqdori',
    example: 4,
  })
  @IsNumber({}, { message: "Miqdori raqam bo'lishi kerak" })
  @IsPositive({ message: 'Miqdori musbat son bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Miqdori kiritilishi shart' })
  quantity: number;

  @ApiProperty({
    description: "To'lov turi (naqd, terminal, pul o'tkazish)",
    example: 'Naqd',
  })
  @IsString({ message: "To'lov turi matn bo'lishi kerak" })
  @IsNotEmpty({ message: "To'lov turi kiritilishi shart" })
  payment_type: string;

  @ApiProperty({
    description: 'Narxi',
    example: 50000,
  })
  @IsNumber({}, { message: "Narxi raqam bo'lishi kerak" })
  @IsPositive({ message: 'Narxi musbat son bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Narxi kiritilishi shart' })
  price: number;

  @ApiProperty({
    description: 'Umumiy narxi (quantity * price)',
    example: 200000,
  })
  @IsNumber({}, { message: "Umumiy narxi raqam bo'lishi kerak" })
  @IsPositive({ message: 'Umumiy narxi musbat son bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Umumiy narxi kiritilishi shart' })
  total_price: number;

  @ApiProperty({
    description: 'Izoh',
    example: 'Qo\'shimcha izoh',
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Izoh matn bo'lishi kerak" })
  note?: string;

  @ApiProperty({
    description: 'Xarajat sanasi (YYYY-MM-DD)',
    example: '2026-07-27',
  })
  @IsDateString({}, { message: "Sana to'g'ri formatda bo'lishi kerak (YYYY-MM-DD)" })
  @IsNotEmpty({ message: 'Sana kiritilishi shart' })
  date: string;
}
