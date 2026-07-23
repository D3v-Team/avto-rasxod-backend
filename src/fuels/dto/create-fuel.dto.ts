import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFuelDto {
  @ApiProperty({
    description: "Yoqilg'i turi nomi",
    example: 'AI-95',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: "Yoqilg'i nomi matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: "Yoqilg'i nomi kiritilishi shart" })
  @MinLength(2, { message: "Yoqilg'i nomi kamida 2 belgidan iborat bo'lishi kerak" })
  @MaxLength(100, { message: "Yoqilg'i nomi 100 belgidan oshmasligi kerak" })
  name: string;

  @ApiProperty({
    description: "O'lchov birligi",
    example: 'litr',
    minLength: 1,
    maxLength: 20,
  })
  @IsString({ message: "O'lchov birligi matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: "O'lchov birligi kiritilishi shart" })
  @MinLength(1, { message: "O'lchov birligi kamida 1 belgidan iborat bo'lishi kerak" })
  @MaxLength(20, { message: "O'lchov birligi 20 belgidan oshmasligi kerak" })
  unit: string;

  @ApiProperty({
    description: "Yoqilg'i narxi",
    example: 15000,
    minimum: 0,
  })
  @IsNumber({}, { message: "Yoqilg'i narxi raqam bo'lishi kerak" })
  @IsNotEmpty({ message: "Yoqilg'i narxi kiritilishi shart" })
  @Min(0, { message: "Yoqilg'i narxi kamida 0 bo'lishi kerak" })
  price: number;
}
