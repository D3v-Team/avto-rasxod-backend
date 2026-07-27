import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarDailyExpenseService } from './car-daily-expense.service';
import { CarDailyExpenseController } from './car-daily-expense.controller';
import { CarDailyExpense } from './models/car-daily-expense.model';
import { Car } from '../cars/models/cars.models';
import { Fuel } from '../fuels/models/fuels.models';
import { CarFuelNorm } from '../car-fuel-norm/models/car-fuel-norm.model';
import { Employee } from '../employees/models/employee.model';
import { CarFuelNormModule } from '../car-fuel-norm/car-fuel-norm.module';
import { CarFuelNormHistoryModule } from '../car-fuel-norm-history/car-fuel-norm-history.module';

@Module({
  imports: [
    SequelizeModule.forFeature([CarDailyExpense, Car, Fuel, CarFuelNorm, Employee]),
    forwardRef(() => CarFuelNormModule),
    CarFuelNormHistoryModule,
  ],
  controllers: [CarDailyExpenseController],
  providers: [CarDailyExpenseService],
  exports: [CarDailyExpenseService],
})
export class CarDailyExpenseModule { }
