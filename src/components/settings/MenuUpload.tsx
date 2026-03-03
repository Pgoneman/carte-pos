import { useState, useRef } from 'react';
import { Upload } from 'lucide-react';
import { parseMenuExcel } from '../../utils/excelParser';
import { uploadMenus } from '../../services/menuService';
import { usePosStore } from '../../stores/posStore';

/**
 * 엑셀 파일 업로드 → 파싱 → Supabase menus 테이블 저장
 */
export default function MenuUpload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fetchMenus = usePosStore((s) => s.fetchMenus);
  const showToast = usePosStore((s) => s.showToast);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setUploading(true);
    try {
      const rows = await parseMenuExcel(file);
      if (rows.length === 0) {
        setMessage({ type: 'err', text: '유효한 메뉴 행이 없습니다. (이름, 가격 필수)' });
        return;
      }
      const { count, error } = await uploadMenus(rows);
      if (error) {
        setMessage({ type: 'err', text: error });
        showToast(error);
        return;
      }
      setMessage({ type: 'ok', text: `${count}개 메뉴가 등록되었습니다.` });
      showToast(`${count}개 메뉴 등록 완료`);
      await fetchMenus();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '업로드 실패';
      setMessage({ type: 'err', text: message });
      showToast(message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
      <h3 className="font-bold text-gray-800 mb-2">메뉴 엑셀 업로드</h3>
      <p className="text-xs text-gray-500 mb-3">
        엑셀 컬럼: 이름(또는 name), 카테고리(또는 category_name), 가격(또는 price)
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
        disabled={uploading}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
      >
        <Upload size={18} />
        {uploading ? '업로드 중...' : '엑셀 선택'}
      </button>
      {message && (
        <p
          className={`mt-2 text-sm ${message.type === 'ok' ? 'text-green-600' : 'text-red-600'}`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
