-- ============================================================
-- Carte MVP — 고객용 테이블오더 마이그레이션
-- menus 테이블 확장 + order_items metadata 추가
-- 사용법: Supabase 대시보드 → SQL Editor → 전체 복사 후 Run
-- ============================================================

-- menus 테이블 확장
ALTER TABLE menus ADD COLUMN IF NOT EXISTS is_ayce      boolean NOT NULL DEFAULT false;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS name_ko      text;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS description  text;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS img          text;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS cal          integer;
ALTER TABLE menus ADD COLUMN IF NOT EXISTS popular      boolean NOT NULL DEFAULT false;

-- order_items에 modifier 메타데이터 저장
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 고기류 메뉴 업데이트 (AYCE + 이모지 + 설명)
UPDATE menus SET is_ayce = true, name_ko = '삼겹살',     description = 'Classic pork belly, thick-cut',          img = '🥩', cal = 331, popular = true  WHERE name = '삼겹살';
UPDATE menus SET is_ayce = true, name_ko = '목살',       description = 'Pork shoulder, juicy & tender',          img = '🥩', cal = 290, popular = false WHERE name = '목살';
UPDATE menus SET is_ayce = true, name_ko = '항정살',     description = 'Pork jowl, rich marbling',               img = '🥩', cal = 350, popular = true  WHERE name = '항정살';
UPDATE menus SET is_ayce = true, name_ko = '갈비살',     description = 'Boneless short rib, premium cut',        img = '🥩', cal = 310, popular = true  WHERE name = '갈비살';
UPDATE menus SET is_ayce = true, name_ko = '소갈비',     description = 'Beef short rib, charcoal-grilled',       img = '🥩', cal = 520, popular = true  WHERE name = '소갈비';
UPDATE menus SET is_ayce = true, name_ko = '차돌박이',   description = 'Beef brisket, thinly sliced',            img = '🥩', cal = 380, popular = false WHERE name = '차돌박이';
UPDATE menus SET is_ayce = true, name_ko = '냉동삼겹',   description = 'Frozen pork belly, budget-friendly',     img = '🥩', cal = 310, popular = false WHERE name = '냉동삼겹';

-- 해산물
UPDATE menus SET is_ayce = true, name_ko = '새우구이',   description = 'Grilled tiger prawns',                   img = '🦐', cal = 120, popular = true  WHERE name = '새우구이';
UPDATE menus SET is_ayce = true, name_ko = '오징어구이', description = 'Grilled squid, lightly seasoned',        img = '🦑', cal = 95,  popular = false WHERE name = '오징어구이';
UPDATE menus SET is_ayce = true, name_ko = '조개구이',   description = 'Grilled clams, natural flavor',          img = '🐚', cal = 80,  popular = false WHERE name = '조개구이';

-- 식사
UPDATE menus SET name_ko = '냉면',       description = 'Cold buckwheat noodles',           img = '🍜', cal = 480 WHERE name = '냉면';
UPDATE menus SET name_ko = '된장찌개',   description = 'Soybean paste stew',               img = '🍲', cal = 250 WHERE name = '된장찌개';
UPDATE menus SET name_ko = '공기밥',     description = 'Steamed white rice',               img = '🍚', cal = 300 WHERE name = '공기밥';
UPDATE menus SET name_ko = '볶음밥',     description = 'Fried rice',                       img = '🍳', cal = 450 WHERE name = '볶음밥';

-- 주류
UPDATE menus SET name_ko = '소주',       description = 'Korean soju, classic',             img = '🍶', cal = 400 WHERE name = '소주';
UPDATE menus SET name_ko = '맥주',       description = 'Draft beer, cold',                 img = '🍺', cal = 200 WHERE name = '맥주';
UPDATE menus SET name_ko = '막걸리',     description = 'Korean rice wine',                 img = '🍶', cal = 300 WHERE name = '막걸리';
UPDATE menus SET name_ko = '소맥세트',   description = 'Soju + Beer combo set',            img = '🍻', cal = 600 WHERE name = '소맥세트';

-- 음료
UPDATE menus SET name_ko = '콜라',       description = 'Coca-Cola',                        img = '🥤', cal = 140 WHERE name = '콜라';
UPDATE menus SET name_ko = '사이다',     description = 'Korean lemon-lime soda',           img = '🥤', cal = 120 WHERE name = '사이다';
UPDATE menus SET name_ko = '물냉면육수', description = 'Cold noodle broth (extra)',         img = '🥣', cal = 30  WHERE name = '물냉면육수';

-- 사리/추가
UPDATE menus SET name_ko = '사리(라면)', description = 'Ramyun noodle add-on',             img = '🍜', cal = 350 WHERE name = '사리(라면)';
UPDATE menus SET name_ko = '사리(당면)', description = 'Glass noodle add-on',              img = '🍜', cal = 180 WHERE name = '사리(당면)';
UPDATE menus SET name_ko = '사리(우동)', description = 'Udon noodle add-on',               img = '🍜', cal = 280 WHERE name = '사리(우동)';
UPDATE menus SET name_ko = '계란',       description = 'Egg',                              img = '🥚', cal = 70  WHERE name = '계란';
UPDATE menus SET name_ko = '치즈',       description = 'Mozzarella cheese topping',        img = '🧀', cal = 110 WHERE name = '치즈';
