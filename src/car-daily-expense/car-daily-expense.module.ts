import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarDailyExpenseService } from './car-daily-expense.service';
import { CarDailyExpenseController } from './car-daily-expense.controller';
import { CarDailyExpense } from './models/car-daily-expense.model';
import { Car } from '../cars/models/cars.models';
import { Fuel } from '../fuels/models/fuels.models';
import { CarFuelNorm } from '../car-fuel-norm/models/car-fuel-norm.model';
import { Employee } from '../employees/models/employee.model';

@Module({
  imports: [
    SequelizeModule.forFeature([CarDailyExpense, Car, Fuel, CarFuelNorm, Employee]),
  ],
  controllers: [CarDailyExpenseController],
  providers: [CarDailyExpenseService],
})
export class CarDailyExpenseModule { }
