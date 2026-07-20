import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FuelService } from './fuel.service';
import { FuelController } from './fuel.controller';
import { Fuel } from './models/fuels.models';

@Module({
  imports: [SequelizeModule.forFeature([Fuel])],
  controllers: [FuelController],
  providers: [FuelService],
})
export class FuelModule {}
