-- ============================================================
-- Carte POS MVP - Supabase Schema
-- 사용법: Supabase 대시보드 → SQL Editor → 전체 복사 후 Run
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- 1. TABLES (테이블 좌석)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tables (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  type         text NOT NULL DEFAULT 'hall'   CHECK (type IN ('hall', 'takeout')),
  status       text NOT NULL DEFAULT 'empty'  CHECK (status IN ('empty', 'occupied', 'reserved')),
  guests       integer,
  start_time   timestamptz,
  total_amount numeric NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 2. MENUS (메뉴판)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS menus (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  category_name text NOT NULL DEFAULT '기타',
  price         numeric NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 3. ORDERS (주문)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id     uuid REFERENCES tables(id) ON DELETE SET NULL,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','cooking','ready','served','completed','cancelled')),
  total_amount numeric NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 4. ORDER_ITEMS (주문 항목)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id  uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_id   text NOT NULL,
  name      text NOT NULL,
  price     numeric NOT NULL DEFAULT 0,
  quantity  integer NOT NULL DEFAULT 1
);

-- ──────────────────────────────────────────────────────────────
-- 5. PAYMENTS (결제 내역)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id   uuid REFERENCES tables(id) ON DELETE SET NULL,
  amount     numeric NOT NULL DEFAULT 0,
  method     text NOT NULL DEFAULT 'card'
               CHECK (method IN ('card','cash','transfer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ──────────────────────────────────────────────────────────────
-- 6. RESERVATIONS (예약)
-- ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reservations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name    text NOT NULL,
  phone_number     text NOT NULL,
  reservation_date timestamptz NOT NULL,
  guests           integer NOT NULL DEFAULT 1,
  table_id         uuid REFERENCES tables(id) ON DELETE SET NULL,
  status           text NOT NULL DEFAULT 'confirmed'
                     CHECK (status IN ('pending','confirmed','cancelled')),
  created_at       timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- RLS (Row Level Security) - anon 키로 전체 읽기/쓰기 허용
-- POS 내부 시스템이므로 별도 인증 없이 anon 권한 허용
-- ============================================================

ALTER TABLE tables       ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus        ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- tables
CREATE POLICY "anon_all_tables"      ON tables       FOR ALL TO anon USING (true) WITH CHECK (true);
-- menus
CREATE POLICY "anon_all_menus"       ON menus        FOR ALL TO anon USING (true) WITH CHECK (true);
-- orders
CREATE POLICY "anon_all_orders"      ON orders       FOR ALL TO anon USING (true) WITH CHECK (true);
-- order_items
CREATE POLICY "anon_all_order_items" ON order_items  FOR ALL TO anon USING (true) WITH CHECK (true);
-- payments
CREATE POLICY "anon_all_payments"    ON payments     FOR ALL TO anon USING (true) WITH CHECK (true);
-- reservations
CREATE POLICY "anon_all_reservations" ON reservations FOR ALL TO anon USING (true) WITH CHECK (true);


-- ============================================================
-- REALTIME 구독 활성화
-- (Supabase 대시보드 Database → Replication 에서도 설정 가능)
-- ============================================================

-- tables, orders, menus 변경을 실시간 구독
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE menus;


-- ============================================================
-- 샘플 데이터 - 홀 테이블 9개 + 포장 1개
-- ============================================================

INSERT INTO tables (name, type, status) VALUES
  ('A-1', 'hall', 'empty'),
  ('A-2', 'hall', 'empty'),
  ('A-3', 'hall', 'empty'),
  ('B-1', 'hall', 'empty'),
  ('B-2', 'hall', 'empty'),
  ('B-3', 'hall', 'empty'),
  ('C-1', 'hall', 'empty'),
  ('C-2', 'hall', 'empty'),
  ('C-3', 'hall', 'empty'),
  ('포장', 'takeout', 'empty')
ON CONFLICT DO NOTHING;


-- ============================================================
-- 샘플 데이터 - 한식 BBQ 메뉴
-- ============================================================

INSERT INTO menus (name, category_name, price, is_active) VALUES
  -- 고기류
  ('삼겹살',         '고기류', 15000, true),
  ('목살',           '고기류', 15000, true),
  ('항정살',         '고기류', 17000, true),
  ('갈비살',         '고기류', 19000, true),
  ('소갈비',         '고기류', 28000, true),
  ('차돌박이',       '고기류', 16000, true),
  ('냉동삼겹',       '고기류', 12000, true),

  -- 해산물
  ('새우구이',       '해산물', 18000, true),
  ('오징어구이',     '해산물', 15000, true),
  ('조개구이',       '해산물', 16000, true),

  -- 식사
  ('냉면',           '식사',    8000, true),
  ('된장찌개',       '식사',    7000, true),
  ('공기밥',         '식사',    1000, true),
  ('볶음밥',         '식사',    3000, true),

  -- 주류
  ('소주',           '주류',    5000, true),
  ('맥주',           '주류',    5000, true),
  ('막걸리',         '주류',    5000, true),
  ('소맥세트',       '주류',    9000, true),

  -- 음료/기타
  ('콜라',           '음료',    2000, true),
  ('사이다',         '음료',    2000, true),
  ('물냉면육수',     '음료',    1000, true),

  -- 사리/추가
  ('사리(라면)',     '사리',    2000, true),
  ('사리(당면)',     '사리',    2000, true),
  ('사리(우동)',     '사리',    2000, true),
  ('계란',           '사리',    1000, true),
  ('치즈',           '사리',    2000, true)
ON CONFLICT DO NOTHING;
