import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Transaction, Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { CarFuelNormHistory } from './models/car-fuel-norm-history.model';

@Injectable()
export class CarFuelNormHistoryService {
  constructor(
    @InjectModel(CarFuelNormHistory)
    private readonly historyRepo: typeof CarFuelNormHistory,
    @InjectConnection() private readonly sequelize: Sequelize,
  ) {}

  async createInitialHistory(carFuelNormId: string, norm_per_100km: number, effectiveFrom?: string, transaction?: Transaction) {
    return this.historyRepo.create(
      {
        car_fuel_norm_id: carFuelNormId,
        norm_per_100km: norm_per_100km,
        effective_from: effectiveFrom || new Date().toISOString().split('T')[0],
        effective_to: null,
      },
      { transaction }
    );
  }

  async closeActiveHistory(carFuelNormId: string, effectiveTo: string, transaction?: Transaction) {
    const openHistory = await this.historyRepo.findOne({
      where: { car_fuel_norm_id: carFuelNormId, effective_to: null },
      transaction,
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
    });

    if (openHistory) {
      await openHistory.update({ effective_to: effectiveTo }, { transaction });
    }
  }



  async getNormForDate(carFuelNormId: string, date: string, transaction?: Transaction): Promise<number> {
    const historyRecord = await this.historyRepo.findOne({
      where: {
        car_fuel_norm_id: carFuelNormId,
        effective_from: { [Op.lte]: date },
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: date } },
        ],
      },
      transaction,
    });

    if (!historyRecord) {
      throw new NotFoundException(
        "Shu sana uchun yoqilg'i normasi topilmadi",
      );
    }

    return historyRecord.norm_per_100km;
  }

  async getPriceForDate(
    carFuelNormId: string,
    date: string,
    t?: Transaction,
  ): Promise<number | null> {
    const historyRecord = await this.historyRepo.findOne({
      where: {
        car_fuel_norm_id: carFuelNormId,
        effective_from: { [Op.lte]: date },
        [Op.or]: [
          { effective_to: null },
          { effective_to: { [Op.gte]: date } },
        ],
      },
      order: [['effective_from', 'DESC']],
      transaction: t,
    });

    return historyRecord ? historyRecord.fuel_price_at_time : null;
  }
}
