import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsNumber,
  Min,
  IsBoolean,
  Length,
  IsOptional,
} from 'class-validator';

export class CreateCarDto {
  @ApiProperty({
    description: 'Mashina nomi',
    example: 'Toyota Camry',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: "Mashina nomi matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Mashina nomi kiritilishi shart' })
  @Length(2, 100, {
    message: "Mashina nomi 2 dan 100 belgigacha bo'lishi kerak",
  })
  name: string;

  @ApiProperty({
    description: 'Mashina davlat raqami',
    example: '01A123AA',
    minLength: 3,
    maxLength: 20,
  })
  @IsString({ message: "Davlat raqami matn ko'rinishida bo'lishi kerak" })
  @IsNotEmpty({ message: 'Davlat raqami kiritilishi shart' })
  @Length(3, 20, {
    message: "Davlat raqami 3 dan 20 belgigacha bo'lishi kerak",
  })
  plate_number: string;

  @ApiProperty({
    description: "Mas'ul xodim ID kaliti",
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', {
    message: "Mas'ul xodim ID si to'g'ri UUID formatida bo'lishi kerak",
  })
  responsible_employee_id?: string;

  @ApiProperty({
    description: 'Haydovchi xodim ID kaliti',
    example: 'uuid',
    required: false,
  })
  @IsOptional()
  @IsUUID('4', {
    message: "Haydovchi xodim ID si to'g'ri UUID formatida bo'lishi kerak",
  })
  driver_id?: string;

  @ApiProperty({
    description: "Spidometr ko'rsatkichi",
    example: 0,
    minimum: 0,
    default: 0,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Spidometr ko'rsatkichi raqam bo'lishi kerak" })
  @Min(0, { message: "Spidometr ko'rsatkichi kamida 0 bo'lishi kerak" })
  speedometer?: number = 0;

  @ApiProperty({
    description: 'Mashina faol yoki faol emasligi',
    example: true,
    default: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean({
    message: "is_active true yoki false qiymatida bo'lishi kerak",
  })
  is_active?: boolean = true;
}
