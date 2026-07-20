import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CarService } from './car.service';
import { CarController } from './car.controller';
import { Car } from './models/cars.models';
import { Employee } from '../employees/models/employee.model';

@Module({
  imports: [SequelizeModule.forFeature([Car, Employee])],
  controllers: [CarController],
  providers: [CarService],
})
export class CarModule {}
