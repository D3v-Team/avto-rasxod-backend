import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsDateString } from 'class-validator';

export class ReportQueryDto {
  @ApiProperty({
    description: 'Boshlanish sanasi (YYYY-MM-DD)',
    example: '2026-01-01',
    required: true,
  })
  @IsNotEmpty({ message: 'Boshlanish sanasi kiritilishi shart' })
  @IsDateString({}, { message: "Noto'g'ri sana formati" })
  date_from: string;

  @ApiProperty({
    description: 'Tugash sanasi (YYYY-MM-DD)',
    example: '2026-12-31',
    required: true,
  })
  @IsNotEmpty({ message: 'Tugash sanasi kiritilishi shart' })
  @IsDateString({}, { message: "Noto'g'ri sana formati" })
  date_to: string;
}
