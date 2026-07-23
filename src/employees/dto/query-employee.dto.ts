import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryIs_deleteDto {
  @ApiProperty({
    required: false,
    description:
      "true — faqat o'chirilgan yozuvlarni ko'rsatadi, false — faqat " +
      "aktiv (o'chirilmagan) yozuvlarni ko'rsatadi, " +
      'berilmasa faqat aktiv yozuvlar qaytadi',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: "is_deleted true yoki false qiymatida bo'lishi kerak" })
  is_deleted?: boolean;

  @ApiProperty({
    description: 'Sahifa raqami',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: "Sahifa raqami raqam bo'lishi kerak" })
  @Min(1, { message: "Sahifa raqami kamida 1 bo'lishi kerak" })
  page?: number = 1;
}
