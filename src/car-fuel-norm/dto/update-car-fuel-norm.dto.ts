import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateCarFuelNormDto } from './create-car-fuel-norm.dto';
import { IsNumber, IsOptional } from 'class-validator';

export class UpdateCarFuelNormDto extends PartialType(
  OmitType(CreateCarFuelNormDto, [
    'car_id',
    'fuel_id',
    'current_balance',
  ] as const),
) {
  @ApiProperty({
    description: 'Boshlang‘ich yoqilg‘i balansi',
    example: 10,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: "Boshlang'ich balans raqam bo'lishi kerak" })
  initial_balance?: number;
}
