-- ============================================================
-- 고객 테이블오더 마이그레이션 검증 쿼리
-- supabase_migration_customer.sql 실행 후 이 쿼리로 확인
-- ============================================================

-- 1) menus: 신규 컬럼 존재 + AYCE 설정 확인
SELECT
  name,
  name_ko,
  category_name,
  is_ayce,
  img,
  cal,
  popular,
  LEFT(description, 40) AS description_preview
FROM menus
ORDER BY category_name, name;

-- 2) AYCE 메뉴만 필터 (고기류 + 해산물 = 10개 예상)
SELECT name, name_ko, category_name
FROM menus
WHERE is_ayce = true
ORDER BY category_name, name;

-- 3) order_items: metadata 컬럼 존재 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'order_items' AND column_name = 'metadata';

-- 4) 전체 카테고리별 메뉴 수 + AYCE 비율
SELECT
  category_name,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_ayce = true) AS ayce_count,
  COUNT(*) FILTER (WHERE name_ko IS NOT NULL) AS has_korean_name
FROM menus
GROUP BY category_name
ORDER BY category_name;
