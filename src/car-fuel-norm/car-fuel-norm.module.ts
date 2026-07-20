import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarFuelNormService } from './car-fuel-norm.service';
import { CarFuelNormController } from './car-fuel-norm.controller';
import { CarFuelNorm } from './models/car-fuel-norm.model';
import { Car } from '../cars/models/cars.models';
import { Fuel } from '../fuels/models/fuels.models';

@Module({
  imports: [SequelizeModule.forFeature([CarFuelNorm, Car, Fuel])],
  controllers: [CarFuelNormController],
  providers: [CarFuelNormService],
})
export class CarFuelNormModule {}
