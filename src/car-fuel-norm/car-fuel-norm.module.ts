import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarFuelNormService } from './car-fuel-norm.service';
import { CarFuelNormController } from './car-fuel-norm.controller';
import { CarFuelNorm } from './models/car-fuel-norm.model';
import { Car } from '../cars/models/cars.models';
import { Fuel } from '../fuels/models/fuels.models';
import { CarDailyExpense } from '../car-daily-expense/models/car-daily-expense.model';

@Module({
  imports: [SequelizeModule.forFeature([CarFuelNorm, Car, Fuel, CarDailyExpense])],
  controllers: [CarFuelNormController],
  providers: [CarFuelNormService],
})
export class CarFuelNormModule {}
