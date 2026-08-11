import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CarSparePartsExpenseService } from './car-spare-parts-expense.service';
import { CreateCarSparePartsExpenseDto } from './dto/create-car-spare-parts-expense.dto';
import { UpdateCarSparePartsExpenseDto } from './dto/update-car-spare-parts-expense.dto';
import { QueryCarSparePartsExpenseDto } from './dto/query-car-spare-parts-expense.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { Response } from 'express';
import { Res } from '@nestjs/common';
import { UserRole } from '../common/enums/user-role.enum';
import { Roles } from '../common/decorators/roles-auth-decorator';

@ApiTags('Car Spare Parts Expenses')
@ApiBearerAuth()
@Controller('car-spare-parts-expenses')
export class CarSparePartsExpenseController {
  constructor(
    private readonly carSparePartsExpenseService: CarSparePartsExpenseService,
  ) {}

  @ApiOperation({ summary: "Ehtiyot qismlar xarajatlarini ro'yxatini olish" })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli olindi' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryCarSparePartsExpenseDto) {
    return this.carSparePartsExpenseService.findAll(query);
  }

  @ApiOperation({ summary: '1040-счет бўйича Excel hisobotini yuklab olish' })
  @ApiQuery({ name: 'date_from', required: true, example: '2026-01-01' })
  @ApiQuery({ name: 'date_to', required: true, example: '2026-03-31' })
  @ApiQuery({ name: 'org_name', required: false, example: 'Ташкилот' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('report/excel-ledger')
  async getExcelLedgerReport(
    @Query('date_from') dateFrom: string,
    @Query('date_to') dateTo: string,
    @Query('org_name') orgName: string,
    @Res() res: Response,
  ) {
    if (!dateFrom || !dateTo) {
      throw new BadRequestException(
        'date_from va date_to parametrlari majburiy',
      );
    }

    const buffer = await this.carSparePartsExpenseService.getExcelLedgerReport(
      dateFrom,
      dateTo,
      orgName,
    );

    const fileName = `Avto_zapchast_rasxod_${dateFrom}_${dateTo}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    return res.send(buffer);
  }

  @ApiOperation({ summary: "ID bo'yicha xarajatni olish" })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli olindi' })
  @ApiResponse({ status: 404, description: 'Yozuv topilmadi' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.carSparePartsExpenseService.findOne(id);
  }

  @ApiOperation({ summary: "Yangi ehtiyot qism xarajatini qo'shish" })
  @ApiResponse({ status: 201, description: 'Muvaffaqiyatli yaratildi' })
  @ApiResponse({ status: 404, description: 'Mashina topilmadi' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  create(@Body() createCarSparePartsExpenseDto: CreateCarSparePartsExpenseDto) {
    return this.carSparePartsExpenseService.create(
      createCarSparePartsExpenseDto,
    );
  }

  @ApiOperation({ summary: 'Xarajatni yangilash' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli yangilandi' })
  @ApiResponse({ status: 404, description: 'Yozuv topilmadi' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCarSparePartsExpenseDto: UpdateCarSparePartsExpenseDto,
  ) {
    return this.carSparePartsExpenseService.update(
      id,
      updateCarSparePartsExpenseDto,
    );
  }

  @ApiOperation({ summary: "Xarajatni o'chirish" })
  @ApiResponse({ status: 200, description: "Muvaffaqiyatli o'chirildi" })
  @ApiResponse({ status: 404, description: 'Yozuv topilmadi' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.carSparePartsExpenseService.remove(id);
  }
}
