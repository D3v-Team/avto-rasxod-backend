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
import { CarFuelNormService } from './car-fuel-norm.service';
import { CreateCarFuelNormDto } from './dto/create-car-fuel-norm.dto';
import { UpdateCarFuelNormDto } from './dto/update-car-fuel-norm.dto';
import { QueryCarFuelNormDto } from './dto/query-car-fuel-norm.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { Roles } from '../common/decorators/roles-auth-decorator';

@ApiTags('Car Fuel Norms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('car-fuel-norms')
export class CarFuelNormController {
  constructor(private readonly carFuelNormService: CarFuelNormService) {}

  @ApiOperation({ summary: 'Yangi norma yaratish' })
  @ApiResponse({ status: 201, description: 'Norma muvaffaqiyatli yaratildi' })
  @ApiResponse({ status: 409, description: 'Norma allaqachon mavjud' })
  @ApiResponse({ status: 404, description: "Mashina yoki yoqilg'i topilmadi" })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  create(@Body() createCarFuelNormDto: CreateCarFuelNormDto) {
    return this.carFuelNormService.create(createCarFuelNormDto);
  }

  @ApiOperation({
    summary: 'Barcha normalarni olish (pagination va filter bilan)',
  })
  @ApiResponse({ status: 200, description: 'Normalar muvaffaqiyatli olindi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'car_id', required: false, type: String })
  @ApiQuery({ name: 'fuel_id', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['norm_per_100km', 'current_balance', 'createdAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryCarFuelNormDto) {
    return this.carFuelNormService.findAll(query);
  }

  @ApiOperation({ summary: "ID bo'yicha norma olish" })
  @ApiResponse({ status: 200, description: 'Norma muvaffaqiyatli olindi' })
  @ApiResponse({ status: 404, description: 'Norma topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.carFuelNormService.findOne(id);
  }

  @ApiOperation({ summary: "ID bo'yicha norma yangilash" })
  @ApiResponse({ status: 200, description: 'Norma muvaffaqiyatli yangilandi' })
  @ApiResponse({ status: 404, description: 'Norma topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCarFuelNormDto: UpdateCarFuelNormDto,
  ) {
    return this.carFuelNormService.update(id, updateCarFuelNormDto);
  }

  @ApiOperation({ summary: "ID bo'yicha norma o'chirish" })
  @ApiResponse({ status: 200, description: "Norma muvaffaqiyatli o'chirildi" })
  @ApiResponse({ status: 404, description: 'Norma topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.carFuelNormService.remove(id);
  }
}
