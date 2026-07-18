import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Put,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles-auth-decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ResetPasswordDto } from './dto/resetPassword.dto';
import { UserRole } from '../common/enums/user-role.enum';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Admin yaratish' })
  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.createUser(dto);
  }

  @ApiOperation({ summary: 'Barcha adminlarni olish' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get('admin')
  getAdminUsers() {
    return this.userService.getAdminUsers();
  }

  @ApiOperation({ summary: 'Adminlarni sahifalab (pagination) olish' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiQuery({ name: 'page', required: false })
  @Get('page')
  getPaginatedUsers(@Query('page') page: number) {
    return this.userService.getPaginatedUsers(page);
  }

  @ApiOperation({ summary: 'ID boyicha adminni olish' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @ApiOperation({ summary: 'ID boyicha adminni yangilash' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Put(':id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, dto);
  }

  @ApiOperation({ summary: 'Admin parolini tiklash' })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Post('reset-password/:id')
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.userService.resetUserPassword(id, dto);
  }

  @ApiOperation({ summary: "Adminni o'chirish" })
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
