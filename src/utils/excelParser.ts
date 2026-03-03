import * as XLSX from 'xlsx';

export interface ParsedMenuRow {
  name: string;
  category_name: string;
  price: number;
  external_id?: string;
  [key: string]: unknown;
}

/**
 * 엑셀 파일에서 메뉴 시트 파싱 (첫 행 헤더 기준)
 * 예상 컬럼: 이름/name, 카테고리/category_name/category, 가격/price
 */
export function parseMenuExcel(file: File): Promise<ParsedMenuRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('파일을 읽을 수 없습니다'));
          return;
        }
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet);
        const normalized = rows.map((row) => normalizeRow(row));
        resolve(normalized.filter((r) => r.name && r.price > 0));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsBinaryString(file);
  });
}

function normalizeRow(row: Record<string, unknown>): ParsedMenuRow {
  const getStr = (...keys: string[]) => {
    for (const k of keys) {
      const v = row[k];
      if (v != null && String(v).trim()) return String(v).trim();
    }
    return '';
  };
  const getNum = (...keys: string[]) => {
    for (const k of keys) {
      const v = row[k];
      if (v != null) {
        const n = typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.-]/g, ''));
        if (!Number.isNaN(n)) return n;
      }
    }
    return 0;
  };

  const name = getStr('이름', 'name', '메뉴명', '품목명');
  const category_name = getStr('카테고리', 'category_name', 'category', '분류');
  const price = getNum('가격', 'price', '단가');

  return {
    name,
    category_name: category_name || '기타',
    price,
    external_id: getStr('external_id', 'id') || undefined,
  };
}
