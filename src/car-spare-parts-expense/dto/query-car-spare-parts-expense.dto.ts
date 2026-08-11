import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryCarSparePartsExpenseDto {
  @ApiProperty({ required: false, default: 1, description: 'Sahifa raqami' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    default: 15,
    description: 'Sahifadagi elementlar soni',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 15;

  @ApiProperty({
    required: false,
    description: "Mashina ID bo'yicha filterlash",
  })
  @IsOptional()
  @IsUUID('4')
  car_id?: string;

  @ApiProperty({
    required: false,
    description: 'Shu sanadan boshlab (YYYY-MM-DD)',
  })
  @IsOptional()
  @IsString()
  date_from?: string;

  @ApiProperty({ required: false, description: 'Shu sanagacha (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  date_to?: string;

  @ApiProperty({
    required: false,
    description: "To'lov turi bo'yicha filterlash",
  })
  @IsOptional()
  @IsString()
  payment_type?: string;

  @ApiProperty({ required: false, description: "Qidiruv (part_name bo'yicha)" })
  @IsOptional()
  @IsString()
  search?: string;
}
