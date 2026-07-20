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
} from '@nestjs/swagger';
import { CarService } from './car.service';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { QueryCarDto } from './dto/query-car.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles-auth-decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Cars')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cars')
export class CarController {
  constructor(private readonly carService: CarService) {}

  @ApiOperation({ summary: 'Yangi mashina yaratish' })
  @ApiResponse({ status: 201, description: 'Mashina muvaffaqiyatli yaratildi' })
  @ApiResponse({ status: 409, description: 'Mashina allaqachon mavjud' })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  create(@Body() createCarDto: CreateCarDto) {
    return this.carService.create(createCarDto);
  }

  @ApiOperation({
    summary: 'Barcha mashinalarni olish (pagination va search bilan)',
  })
  @ApiResponse({ status: 200, description: 'Mashinalar muvaffaqiyatli olindi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean })
  @ApiQuery({ name: 'responsible_employee_id', required: false, type: String })
  @ApiQuery({ name: 'driver_id', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'plate_number', 'createdAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryCarDto) {
    return this.carService.findAll(query);
  }

  @ApiOperation({ summary: "ID bo'yicha mashina olish" })
  @ApiResponse({ status: 200, description: 'Mashina muvaffaqiyatli olindi' })
  @ApiResponse({ status: 404, description: 'Mashina topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.carService.findOne(id);
  }

  @ApiOperation({ summary: "ID bo'yicha mashina yangilash" })
  @ApiResponse({
    status: 200,
    description: 'Mashina muvaffaqiyatli yangilandi',
  })
  @ApiResponse({ status: 404, description: 'Mashina topilmadi' })
  @ApiResponse({ status: 409, description: 'Mashina allaqachon mavjud' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCarDto: UpdateCarDto,
  ) {
    return this.carService.update(id, updateCarDto);
  }

  @ApiOperation({ summary: "ID bo'yicha mashina o'chirish" })
  @ApiResponse({
    status: 200,
    description: "Mashina muvaffaqiyatli o'chirildi",
  })
  @ApiResponse({ status: 404, description: 'Mashina topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.carService.remove(id);
  }
}
