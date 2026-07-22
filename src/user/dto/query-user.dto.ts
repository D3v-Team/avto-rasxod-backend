import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryUserDto {
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
}
