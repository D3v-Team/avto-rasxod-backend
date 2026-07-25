import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarFuelNormHistoryService } from './car-fuel-norm-history.service';
import { CarFuelNormHistoryController } from './car-fuel-norm-history.controller';
import { CarFuelNormHistory } from './models/car-fuel-norm-history.model';
import { CarFuelNormModule } from '../car-fuel-norm/car-fuel-norm.module';

@Module({
  imports: [
    SequelizeModule.forFeature([CarFuelNormHistory]),
    forwardRef(() => CarFuelNormModule),
  ],
  controllers: [CarFuelNormHistoryController],
  providers: [CarFuelNormHistoryService],
  exports: [CarFuelNormHistoryService],
})
export class CarFuelNormHistoryModule {}
