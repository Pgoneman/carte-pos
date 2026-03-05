-- AYCE 이용권 마이그레이션
-- is_ayce_pass: "이용권" 상품 마커 (이용권 자체는 is_ayce = false)
-- 기존 고기/해산물의 is_ayce = true는 유지 (= "이용권 있을 때 무료 대상")

ALTER TABLE menus ADD COLUMN IF NOT EXISTS is_ayce_pass boolean NOT NULL DEFAULT false;

INSERT INTO menus (name, name_ko, category_name, price, is_active, is_ayce, is_ayce_pass, description, img)
VALUES
  ('AYCE 이용권(성인)', 'AYCE 성인', '이용권', 29900, true, false, true, 'All-You-Can-Eat adult pass', '🎫'),
  ('AYCE 이용권(아동)', 'AYCE 아동', '이용권', 19900, true, false, true, 'All-You-Can-Eat child pass', '🎟️');
