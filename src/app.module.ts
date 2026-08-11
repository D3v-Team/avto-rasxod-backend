import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';

import { User } from './user/models/user.model';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard';
import { EmployeesModule } from './employees/employees.module';
import { FuelModule } from './fuels/fuel.module';
import { Fuel } from './fuels/models/fuels.models';
import { CarModule } from './cars/car.module';
import { Car } from './cars/models/cars.models';
import { Employee } from './employees/models/employee.model';
import { CarFuelNormModule } from './car-fuel-norm/car-fuel-norm.module';
import { CarDailyExpenseModule } from './car-fuel-daily-expense/car-fuel-daily-expense.module';
import { CarFuelNorm } from './car-fuel-norm/models/car-fuel-norm.model';
import { CarDailyExpense } from './car-fuel-daily-expense/models/car-fuel-daily-expense.model';
import { CarSparePartsExpenseModule } from './car-spare-parts-expense/car-spare-parts-expense.module';
import { CarSparePartsExpense } from './car-spare-parts-expense/models/car-spare-parts-expense.model';
import { CarFuelNormHistory } from './car-fuel-norm-history/models/car-fuel-norm-history.model';
import { CarFuelNormHistoryModule } from './car-fuel-norm-history/car-fuel-norm-history.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        dialect: 'postgres' as const,
        host: config.get<string>('POSTGRES_HOST'),
        port: config.get<number>('POSTGRES_PORT'),
        username: config.get<string>('POSTGRES_USER'),
        password: config.get<string>('POSTGRES_PASSWORD'),
        database: config.get<string>('POSTGRES_DB'),
        models: [
          User,
          Fuel,
          Car,
          Employee,
          CarFuelNorm,
          CarDailyExpense,
          CarSparePartsExpense,
          CarFuelNormHistory,
        ],
        autoLoadModels: true,
        synchronize: true,
        sync: { alter: true },
        logging: false,
        pool: {
          max: 10,
          min: 2,
          acquire: 30000,
          idle: 10000,
        },
      }),
    }),

    AuthModule,
    UserModule,
    EmployeesModule,
    FuelModule,
    CarModule,
    CarFuelNormModule,
    CarDailyExpenseModule,
    CarSparePartsExpenseModule,
    CarFuelNormHistoryModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
