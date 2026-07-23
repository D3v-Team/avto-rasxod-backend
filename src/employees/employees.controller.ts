import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { QueryIs_deleteDto } from './dto/query-employee.dto';
import { Roles } from '../common/decorators/roles-auth-decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { UserRole } from '../common/enums/user-role.enum';
import { EmployeeRole } from '../common/enums/employee-role.enum';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @ApiOperation({ summary: "Xodim qo'shish" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeesService.create(createEmployeeDto);
  }

  @ApiOperation({ summary: 'Barcha xodimlarni olish' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get()
  findAll(@Query() query: QueryIs_deleteDto) {
    return this.employeesService.findAll(query);
  }

  @ApiOperation({ summary: 'Xodimlarni filterlab olish' })
  @ApiQuery({
    name: 'role',
    enum: Object.values(EmployeeRole),
    required: false,
  })
  @ApiQuery({ name: 'searchTerm', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('filter')
  filter(
    @Query('role') role: EmployeeRole,
    @Query('searchTerm') searchTerm: string,
    @Query('page') page: number,
  ) {
    return this.employeesService.filter({ role, searchTerm, page });
  }

  @ApiOperation({ summary: 'ID boyicha xodimni olish' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.employeesService.findOne(id);
  }

  @ApiOperation({ summary: 'ID boyicha xodimni yangilash' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(id, updateEmployeeDto);
  }

  @ApiOperation({ summary: "Xodimni o'chirish" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.employeesService.remove(id);
  }

  @ApiOperation({ summary: "Xodimni tiklash" })
  @ApiResponse({
    status: 200,
    description: "Xodim muvaffaqiyatli tiklandi",
  })
  @ApiResponse({ status: 404, description: 'Xodim topilmadi' })
  @ApiResponse({ status: 401, description: "Ruxsat yo'q" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Patch('restore/:id')
  restore(@Param('id') id: string) {
    return this.employeesService.restore(id);
  }
}
