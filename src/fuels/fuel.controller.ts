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
import { FuelService } from './fuel.service';
import { CreateFuelDto } from './dto/create-fuel.dto';
import { UpdateFuelDto } from './dto/update-fuel.dto';
import { QueryFuelDto } from './dto/query-fuel.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles-auth-decorator';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Fuels')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fuels')
export class FuelController {
  constructor(private readonly fuelService: FuelService) {}

  @ApiOperation({ summary: 'Yangi fuel yaratish' })
  @ApiResponse({ status: 201, description: 'Fuel muvaffaqiyatli yaratildi' })
  @ApiResponse({ status: 409, description: 'Fuel allaqachon mavjud' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  create(@Body() createFuelDto: CreateFuelDto) {
    return this.fuelService.create(createFuelDto);
  }

  @ApiOperation({
    summary: 'Barcha fuel larni olish (pagination va search bilan)',
  })
  @ApiResponse({ status: 200, description: 'Fuel lar muvaffaqiyatli olindi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'price', 'createdAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryFuelDto) {
    return this.fuelService.findAll(query);
  }

  @ApiOperation({ summary: "ID bo'yicha fuel olish" })
  @ApiResponse({ status: 200, description: 'Fuel muvaffaqiyatli olindi' })
  @ApiResponse({ status: 404, description: 'Fuel topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.fuelService.findOne(id);
  }

  @ApiOperation({ summary: "ID bo'yicha fuel yangilash" })
  @ApiResponse({ status: 200, description: 'Fuel muvaffaqiyatli yangilandi' })
  @ApiResponse({ status: 404, description: 'Fuel topilmadi' })
  @ApiResponse({ status: 409, description: 'Fuel allaqachon mavjud' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateFuelDto: UpdateFuelDto,
  ) {
    return this.fuelService.update(id, updateFuelDto);
  }

  @ApiOperation({ summary: "ID bo'yicha fuel o'chirish" })
  @ApiResponse({ status: 200, description: "Fuel muvaffaqiyatli o'chirildi" })
  @ApiResponse({ status: 404, description: 'Fuel topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.fuelService.remove(id);
  }
}
