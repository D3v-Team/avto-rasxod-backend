import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CarDailyExpenseService } from './car-daily-expense.service';
import { CreateCarDailyExpenseDto } from './dto/create-car-daily-expense.dto';
import { UpdateCarDailyExpenseDto } from './dto/update-car-daily-expense.dto';
import { QueryCarDailyExpenseDto } from './dto/query-car-daily-expense.dto';
import { CarMonthlyReportQueryDto } from './dto/car-monthly-report-query.dto';
import { MonthlyStatisticsQueryDto } from './dto/monthly-statistics-query.dto';
import { YearlyStatisticsQueryDto } from './dto/yearly-statistics-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { Roles } from '../common/decorators/roles-auth-decorator';

@ApiTags('Car Daily Expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('car-daily-expenses')
export class CarDailyExpenseController {
  constructor(
    private readonly carDailyExpenseService: CarDailyExpenseService,
  ) {}

  @ApiOperation({ summary: 'Yangi kunlik xarajat yaratish' })
  @ApiResponse({
    status: 201,
    description: 'Kunlik xarajat muvaffaqiyatli yaratildi',
  })
  @ApiResponse({ status: 409, description: 'Sana allaqachon kiritilgan' })
  @ApiResponse({ status: 404, description: 'Mashina yoki norma topilmadi' })
  @ApiResponse({ status: 400, description: "Odometer qiymati noto'g'ri" })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  create(@Body() createCarDailyExpenseDto: CreateCarDailyExpenseDto) {
    return this.carDailyExpenseService.create(createCarDailyExpenseDto);
  }

  @ApiOperation({ summary: 'Bitta mashinaning oylik kunlik hisoboti' })
  @ApiResponse({
    status: 200,
    description: 'Mashina oylik hisoboti muvaffaqiyatli olindi',
  })
  @ApiResponse({ status: 404, description: 'Mashina topilmadi' })
  @ApiResponse({ status: 400, description: "Noto'g'ri month formati" })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @ApiQuery({ name: 'car_id', required: true })
  @ApiQuery({ name: 'month', required: true, example: '2026-06' })
  @ApiQuery({ name: 'fuel_id', required: false })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('car-monthly-report')
  getCarMonthlyReport(@Query() query: CarMonthlyReportQueryDto) {
    return this.carDailyExpenseService.getCarMonthlyReport(query);
  }

  @ApiOperation({ summary: "Barcha mashinalar bo'yicha oylik statistika" })
  @ApiResponse({
    status: 200,
    description: 'Oylik statistika muvaffaqiyatli olindi',
  })
  @ApiResponse({ status: 400, description: "Noto'g'ri month formati" })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @ApiQuery({ name: 'month', required: true, example: '2026-06' })
  @ApiQuery({ name: 'is_active', required: false })
  @ApiQuery({ name: 'car_id', required: false })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('monthly-statistics')
  getMonthlyStatistics(@Query() query: MonthlyStatisticsQueryDto) {
    return this.carDailyExpenseService.getMonthlyStatistics(query);
  }

  @Get('yearly-statistics')
  @ApiOperation({ summary: "Barcha mashinalar bo'yicha yillik statistika" })
  @ApiQuery({ name: 'year', required: true, example: 2026 })
  @ApiQuery({ name: 'car_id', required: false })
  @ApiQuery({ name: 'is_active', required: false })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  findYearlyStatistics(@Query() query: YearlyStatisticsQueryDto) {
    return this.carDailyExpenseService.getYearlyStatistics(query);
  }

  @ApiOperation({
    summary: "Mashinaning oylik yoqilg'i jamlanmasi (oy boshiga/oxiriga balans)",
  })
  @ApiResponse({
    status: 200,
    description: 'Oylik yoqilg\'i jamlanmasi muvaffaqiyatli olindi',
  })
  @ApiResponse({ status: 404, description: 'Hisobot topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @ApiParam({ name: 'car_id', required: true, type: String })
  @ApiQuery({ name: 'month', required: true, type: String, example: '2024-01' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('monthly-summary/:car_id')
  getMonthlyReport(
    @Param('car_id', new ParseUUIDPipe()) car_id: string,
    @Query('month') month: string,
  ) {
    return this.carDailyExpenseService.getMonthlyReport(car_id, month);
  }

  @ApiOperation({
    summary: 'Barcha kunlik xarajatlarni olish (pagination va filter bilan)',
  })
  @ApiResponse({
    status: 200,
    description: 'Kunlik xarajatlar muvaffaqiyatli olindi',
  })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'car_id', required: false, type: String })
  @ApiQuery({ name: 'fuel_id', required: false, type: String })
  @ApiQuery({ name: 'date_from', required: false, type: String })
  @ApiQuery({ name: 'date_to', required: false, type: String })
  @ApiQuery({ name: 'is_holiday', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['date', 'sequence_no', 'mileage', 'fuel_expence', 'balance_after'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryCarDailyExpenseDto) {
    return this.carDailyExpenseService.findAll(query);
  }

  @ApiOperation({ summary: "ID bo'yicha kunlik xarajat olish" })
  @ApiResponse({
    status: 200,
    description: 'Kunlik xarajat muvaffaqiyatli olindi',
  })
  @ApiResponse({ status: 404, description: 'Kunlik xarajat topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.carDailyExpenseService.findOne(id);
  }

  @ApiOperation({ summary: "ID bo'yicha kunlik xarajat yangilash" })
  @ApiResponse({
    status: 200,
    description: 'Kunlik xarajat muvaffaqiyatli yangilandi',
  })
  @ApiResponse({ status: 404, description: 'Kunlik xarajat topilmadi' })
  @ApiResponse({
    status: 403,
    description: 'Faqat oxirgi yozuvni tahrirlash mumkin',
  })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCarDailyExpenseDto: UpdateCarDailyExpenseDto,
  ) {
    return this.carDailyExpenseService.update(id, updateCarDailyExpenseDto);
  }

  @ApiOperation({ summary: "ID bo'yicha kunlik xarajat o'chirish" })
  @ApiResponse({
    status: 200,
    description: "Kunlik xarajat muvaffaqiyatli o'chirildi",
  })
  @ApiResponse({ status: 404, description: 'Kunlik xarajat topilmadi' })
  @ApiResponse({
    status: 403,
    description: "Faqat oxirgi yozuvni o'chirish mumkin",
  })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.carDailyExpenseService.remove(id);
  }
}
