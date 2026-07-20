import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCarDailyExpenseDto } from './create-car-daily-expense.dto';

export class UpdateCarDailyExpenseDto extends PartialType(
  OmitType(CreateCarDailyExpenseDto, ['car_id', 'fuel_id', 'date'] as const),
) {}
