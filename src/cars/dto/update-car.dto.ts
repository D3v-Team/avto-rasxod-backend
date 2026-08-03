import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCarDto } from './create-car.dto';

export class UpdateCarDto extends PartialType(OmitType(CreateCarDto, ['odometer'] as const)) {}
