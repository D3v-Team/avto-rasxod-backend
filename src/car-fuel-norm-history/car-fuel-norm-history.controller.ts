import { Controller, Req, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CarFuelNormHistoryService } from './car-fuel-norm-history.service';
import { UserRole } from '../common/enums/user-role.enum';
import { UpdateCarFuelNormDto } from '../car-fuel-norm/dto/update-car-fuel-norm.dto';
import { Roles } from '../common/decorators/roles-auth-decorator';

@ApiTags('Car Fuel Norm History')
@Controller('car-fuel-norm-history')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CarFuelNormHistoryController {
  constructor(
    private readonly carFuelNormHistoryService: CarFuelNormHistoryService,
  ) {}

  // @ApiOperation({ summary: "Avto yoqilg'i normasini o'zgartirish" })
  // @ApiResponse({ status: 200, description: "Yoqilg'i normasi o'zgartirildi" })
  // @ApiResponse({ status: 404, description: "Avto topilmadi" })
  // @ApiParam({ name: 'id', description: "Avto yoqilg'i normasi ID" })
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(UserRole.ADMIN)
  // @Patch(':id')
  // update(
  //   @Param('id') id: string,
  //   @Body() updateCarFuelNormDto: UpdateCarFuelNormDto,
  //   @Req() req: Request,
  // ) {
  //   return this.carFuelNormHistoryService.create(+id, updateCarFuelNormDto, req);
  // }
}
