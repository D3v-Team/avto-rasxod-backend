import { PartialType } from '@nestjs/swagger';
import { CreateCarSparePartsExpenseDto } from './create-car-spare-parts-expense.dto';

export class UpdateCarSparePartsExpenseDto extends PartialType(
  CreateCarSparePartsExpenseDto,
) {}
