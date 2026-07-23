import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class QueryUserDto {
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
    required: false,
    description: 'Qidiruv iborasi (ism yoki username bo‘yicha)',
  })
  @IsOptional()
  @IsString({ message: "Qidiruv matni matn ko'rinishida bo'lishi kerak" })
  search?: string;
}
