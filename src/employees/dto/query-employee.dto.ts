import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class QueryIs_deleteDto {
  @ApiProperty({
    required: false,
    description:
      "true — faqat o'chirilgan yozuvlarni ko'rsatadi, false — faqat " +
      "aktiv (o'chirilmagan) yozuvlarni ko'rsatadi (DEFAULT), " +
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
  @IsBoolean()
  is_deleted?: boolean;

  @ApiProperty({
    description: 'Page number',
    example: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;
}
