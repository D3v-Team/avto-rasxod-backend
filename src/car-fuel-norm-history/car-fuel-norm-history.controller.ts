import { Controller } from '@nestjs/common';
import { CarFuelNormHistoryService } from './car-fuel-norm-history.service';

@Controller('car-fuel-norm-history')
export class CarFuelNormHistoryController {
  constructor(private readonly carFuelNormHistoryService: CarFuelNormHistoryService) {}
}
