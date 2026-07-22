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
    description: 'Car name',
    example: 'Toyota Camry',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(2, 100)
  name: string;

  @ApiProperty({
    description: 'Car plate number',
    example: '01A123AA',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  plate_number: string;

  @ApiProperty({
    description: 'Responsible employee ID',
    example: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  responsible_employee_id?: string;

  @ApiProperty({
    description: 'Driver employee ID',
    example: 'uuid',
  })
  @IsUUID()
  @IsOptional()
  driver_id?: string;

  @ApiProperty({
    description: 'Speedometer value',
    example: 0,
    minimum: 0,
    default: 0,
    required: false,
  })
  @IsNumber()
  @Min(0)
  speedometer?: number = 0;

  @ApiProperty({
    description: 'Is car active',
    example: true,
    default: true,
    required: false,
  })
  @IsBoolean()
  is_active?: boolean = true;
}
