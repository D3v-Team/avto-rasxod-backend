import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarSparePartsExpenseService } from './car-spare-parts-expense.service';
import { CarSparePartsExpenseController } from './car-spare-parts-expense.controller';
import { CarSparePartsExpense } from './models/car-spare-parts-expense.model';
import { Car } from '../cars/models/cars.models';
import { Employee } from '../employees/models/employee.model';

@Module({
  imports: [
    SequelizeModule.forFeature([CarSparePartsExpense, Car, Employee]),
  ],
  controllers: [CarSparePartsExpenseController],
  providers: [CarSparePartsExpenseService],
  exports: [CarSparePartsExpenseService],
})
export class CarSparePartsExpenseModule {}
