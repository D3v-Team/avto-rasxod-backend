import { Module, forwardRef } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarService } from './car.service';
import { CarController } from './car.controller';
import { Car } from './models/cars.models';
import { Employee } from '../employees/models/employee.model';
import { CarFuelNorm } from '../car-fuel-norm/models/car-fuel-norm.model';
import { CarDailyExpense } from '../car-daily-expense/models/car-daily-expense.model';
import { CarDailyExpenseModule } from '../car-daily-expense/car-daily-expense.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Car, Employee, CarFuelNorm, CarDailyExpense]),
    forwardRef(() => CarDailyExpenseModule),
  ],
  controllers: [CarController],
  providers: [CarService],
})
export class CarModule {}
