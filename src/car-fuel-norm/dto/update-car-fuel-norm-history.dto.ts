import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDateString, IsOptional, Min } from 'class-validator';

export class UpdateCarFuelNormHistoryDto {
  @ApiProperty({
    description: 'Yangi qiymat qaysi sanadan boshlab amal qilishi (YYYY-MM-DD)',
    example: '2026-10-01',
  })
  @IsDateString({}, { message: 'Amal qilish sanasi to\'g\'ri formatda bo\'lishi kerak' })
  effective_from: string;

  @ApiPropertyOptional({
    description: 'Yangi norma miqdori (har 100km uchun)',
    example: 12.5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Yangi norma raqam bo\'lishi kerak' })
  @Min(0, { message: 'Yangi norma manfiy bo\'lishi mumkin emas' })
  norm_per_100km?: number;

  @ApiPropertyOptional({
    description: 'Yangi yoqilg\'i narxi (1 litr uchun)',
    example: 12500,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Yangi narx raqam bo\'lishi kerak' })
  @Min(0, { message: 'Yangi narx manfiy bo\'lishi mumkin emas' })
  price?: number;
}
