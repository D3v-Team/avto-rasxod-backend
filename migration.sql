-- 1. cars jadvalida: speedometer -> odometer, initial_speedometer -> initial_odometer
ALTER TABLE cars RENAME COLUMN speedometer TO odometer;
ALTER TABLE cars RENAME COLUMN initial_speedometer TO initial_odometer;

-- 2. fuels.price: FLOAT -> DECIMAL(15,2)
ALTER TABLE fuels ALTER COLUMN price TYPE numeric(15, 2) USING price::numeric;

-- 3. car_fuel_norms.initial_balance, current_balance: FLOAT -> DECIMAL(15,2)
ALTER TABLE car_fuel_norms ALTER COLUMN initial_balance TYPE numeric(15, 2) USING initial_balance::numeric;
ALTER TABLE car_fuel_norms ALTER COLUMN current_balance TYPE numeric(15, 2) USING current_balance::numeric;

-- 4. car_daily_expenses.received_amount, fuel_expence, fuel_price_at_time, balance_after: FLOAT -> DECIMAL(15,2)
ALTER TABLE car_daily_expenses ALTER COLUMN received_amount TYPE numeric(15, 2) USING received_amount::numeric;
ALTER TABLE car_daily_expenses ALTER COLUMN fuel_expence TYPE numeric(15, 2) USING fuel_expence::numeric;
ALTER TABLE car_daily_expenses ALTER COLUMN fuel_price_at_time TYPE numeric(15, 2) USING fuel_price_at_time::numeric;
ALTER TABLE car_daily_expenses ALTER COLUMN balance_after TYPE numeric(15, 2) USING balance_after::numeric;

-- 6. FK constraint'larga ON DELETE SET NULL qo'shish (car_daily_expenses)
ALTER TABLE car_daily_expenses DROP CONSTRAINT IF EXISTS car_daily_expenses_responsible_employee_id_at_time_fkey;
ALTER TABLE car_daily_expenses 
  ADD CONSTRAINT car_daily_expenses_responsible_employee_id_at_time_fkey 
  FOREIGN KEY (responsible_employee_id_at_time) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE car_daily_expenses DROP CONSTRAINT IF EXISTS car_daily_expenses_driver_id_at_time_fkey;
ALTER TABLE car_daily_expenses 
  ADD CONSTRAINT car_daily_expenses_driver_id_at_time_fkey 
  FOREIGN KEY (driver_id_at_time) REFERENCES employees(id) ON DELETE SET NULL;

-- car_spare_parts_expenses FKlari uchun
ALTER TABLE car_spare_parts_expenses DROP CONSTRAINT IF EXISTS car_spare_parts_expenses_responsible_employee_id_at_time_fkey;
ALTER TABLE car_spare_parts_expenses 
  ADD CONSTRAINT car_spare_parts_expenses_responsible_employee_id_at_time_fkey 
  FOREIGN KEY (responsible_employee_id_at_time) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE car_spare_parts_expenses DROP CONSTRAINT IF EXISTS car_spare_parts_expenses_driver_id_at_time_fkey;
ALTER TABLE car_spare_parts_expenses 
  ADD CONSTRAINT car_spare_parts_expenses_driver_id_at_time_fkey 
  FOREIGN KEY (driver_id_at_time) REFERENCES employees(id) ON DELETE SET NULL;
