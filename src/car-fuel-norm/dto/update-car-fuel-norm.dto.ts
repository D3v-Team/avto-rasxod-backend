import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCarFuelNormDto } from './create-car-fuel-norm.dto';

export class UpdateCarFuelNormDto extends PartialType(
  OmitType(CreateCarFuelNormDto, ['car_id', 'fuel_id'] as const),
) {}
