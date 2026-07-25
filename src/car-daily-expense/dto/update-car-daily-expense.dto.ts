import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateCarDailyExpenseDto } from './create-car-daily-expense.dto';
import { IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCarDailyExpenseDto extends PartialType(
  OmitType(CreateCarDailyExpenseDto, ['car_id', 'fuel_id'] as const),
) {
  @ApiProperty({
    required: false,
    description: 'Yoqilg\'i turi ID (agar almashtirilmoqchi bo\'lsa)',
  })
  @IsOptional()
  fuel_id?: string;

  @ApiProperty({
    required: false,
    description: 'Xarajat sanasi (YYYY-MM-DD)',
  })
  @IsOptional()
  date?: string;
}
