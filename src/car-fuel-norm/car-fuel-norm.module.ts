import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarFuelNormService } from './car-fuel-norm.service';
import { CarFuelNormController } from './car-fuel-norm.controller';
import { CarFuelNorm } from './models/car-fuel-norm.model';
import { Car } from '../cars/models/cars.models';
import { Fuel } from '../fuels/models/fuels.models';
import { CarDailyExpense } from '../car-fuel-daily-expense/models/car-fuel-daily-expense.model';
import { CarFuelNormHistoryModule } from '../car-fuel-norm-history/car-fuel-norm-history.module';
import { CarDailyExpenseModule } from '../car-fuel-daily-expense/car-fuel-daily-expense.module';
import { forwardRef } from '@nestjs/common';

@Module({
  imports: [
    SequelizeModule.forFeature([CarFuelNorm, Car, Fuel, CarDailyExpense]),
    forwardRef(() => CarFuelNormHistoryModule),
    forwardRef(() => CarDailyExpenseModule),
  ],
  controllers: [CarFuelNormController],
  providers: [CarFuelNormService],
  exports: [CarFuelNormService],
})
export class CarFuelNormModule {}
