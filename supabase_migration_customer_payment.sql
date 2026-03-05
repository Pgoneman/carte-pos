-- 고객 즉시 결제 지원을 위한 마이그레이션
-- tables.status에 'paid' 추가, payments.method에 'easy_pay' 추가

-- tables.status에 'paid' 추가
ALTER TABLE tables DROP CONSTRAINT IF EXISTS tables_status_check;
ALTER TABLE tables ADD CONSTRAINT tables_status_check
  CHECK (status IN ('empty', 'occupied', 'reserved', 'paid'));

-- payments.method에 'easy_pay' 추가
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check
  CHECK (method IN ('card', 'cash', 'transfer', 'easy_pay'));
