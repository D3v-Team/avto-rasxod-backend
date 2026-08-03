import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CorrectInitialBalanceDto {
  @ApiProperty({
    description: "Boshlang'ich yoqilg'i balansi",
    example: 50,
  })
  @IsNumber({}, { message: "Boshlang'ich qoldiq raqam bo'lishi kerak" })
  @Min(0, { message: "Boshlang'ich qoldiq manfiy bo'lishi mumkin emas" })
  new_initial_balance: number;
}
