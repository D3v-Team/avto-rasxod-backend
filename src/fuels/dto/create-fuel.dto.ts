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
    description: 'Fuel name',
    example: 'AI-95',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Fuel unit',
    example: 'liter',
    minLength: 1,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  unit: string;

  @ApiProperty({
    description: 'Fuel price',
    example: 15000,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  price: number;
}
