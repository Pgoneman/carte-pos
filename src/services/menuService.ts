import { supabase } from '../lib/supabase';
import type { ParsedMenuRow } from '../utils/excelParser';

/**
 * 파싱된 메뉴 목록을 Supabase menus 테이블에 upsert
 */
export async function uploadMenus(rows: ParsedMenuRow[]): Promise<{ count: number; error?: string }> {
  if (rows.length === 0) return { count: 0 };

  try {
    const menus = rows.map((row) => ({
      name: row.name,
      category_name: row.category_name,
      price: row.price,
      external_id: row.external_id ?? null,
      price_type: 'fixed',
      tax_type: 'tax',
      stock_enabled: false,
      stock_quantity: 0,
      kiosk_visible: true,
      kiosk_name: row.name,
      kiosk_description: null,
      is_active: true,
    }));

    const { data, error } = await supabase.from('menus').insert(menus).select('id');

    if (error) return { count: 0, error: error.message };
    return { count: Array.isArray(data) ? data.length : data ? 1 : 0 };
  } catch (error) {
    console.error('uploadMenus failed:', error);
    return { count: 0, error: '메뉴 업로드에 실패했습니다.' };
  }
}
