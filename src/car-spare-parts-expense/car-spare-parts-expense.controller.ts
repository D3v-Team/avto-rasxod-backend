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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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

  @ApiOperation({ summary: 'Ehtiyot qismlar xarajatlarini ro\'yxatini olish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli olindi' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryCarSparePartsExpenseDto) {
    return this.carSparePartsExpenseService.findAll(query);
  }

  @ApiOperation({ summary: 'Avto ehtiyot qismlar sarfi Excel hisobotini yuklab olish' })
  @ApiResponse({ status: 200, description: 'Excel fayl muvaffaqiyatli yuklandi' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('report/excel')
  async downloadExcelReport(
    @Query() query: ReportQueryDto,
    @Res() res: Response,
  ) {
    const buffer = await this.carSparePartsExpenseService.exportExcelReport(query);
    const fileName = `avto-extiyot-qismlar-hisoboti_${query.date_from}_${query.date_to}.xlsx`;
    
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    });
    
    res.send(buffer);
  }

  @ApiOperation({ summary: 'ID bo\'yicha xarajatni olish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli olindi' })
  @ApiResponse({ status: 404, description: 'Yozuv topilmadi' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.carSparePartsExpenseService.findOne(id);
  }

  @ApiOperation({ summary: 'Yangi ehtiyot qism xarajatini qo\'shish' })
  @ApiResponse({ status: 201, description: 'Muvaffaqiyatli yaratildi' })
  @ApiResponse({ status: 404, description: 'Mashina topilmadi' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  create(@Body() createCarSparePartsExpenseDto: CreateCarSparePartsExpenseDto) {
    return this.carSparePartsExpenseService.create(createCarSparePartsExpenseDto);
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
    return this.carSparePartsExpenseService.update(id, updateCarSparePartsExpenseDto);
  }

  @ApiOperation({ summary: 'Xarajatni o\'chirish' })
  @ApiResponse({ status: 200, description: 'Muvaffaqiyatli o\'chirildi' })
  @ApiResponse({ status: 404, description: 'Yozuv topilmadi' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.carSparePartsExpenseService.remove(id);
  }
}
