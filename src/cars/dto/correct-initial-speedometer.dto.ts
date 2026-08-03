import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CorrectInitialSpeedometerDto {
  @ApiProperty({
    description: "Boshlang'ich spidometr ko'rsatkichi",
    example: 1000,
  })
  @IsNumber({}, { message: "Boshlang'ich spidometr ko'rsatkichi raqam bo'lishi kerak" })
  @Min(0, { message: "Boshlang'ich spidometr ko'rsatkichi manfiy bo'lishi mumkin emas" })
  new_initial_speedometer: number;
}
