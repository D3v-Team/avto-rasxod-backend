import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsDateString, IsNotEmpty } from 'class-validator';

export class ChangeCarFuelNormDto {
  @ApiProperty({
    description: 'Yangi norma miqdori (har 100km uchun)',
    example: 12.5,
  })
  @IsNumber({}, { message: 'Yangi norma raqam bo\'lishi kerak' })
  @IsPositive({ message: 'Yangi norma musbat son bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Yangi norma kiritilishi shart' })
  new_norm_per_100km: number;

  @ApiProperty({
    description: 'Yangi norma qaysi sanadan boshlab amal qilishi (YYYY-MM-DD)',
    example: '2026-10-01',
  })
  @IsDateString({}, { message: 'Amal qilish sanasi to\'g\'ri formatda bo\'lishi kerak' })
  @IsNotEmpty({ message: 'Amal qilish sanasi kiritilishi shart' })
  effective_from: string;
}
