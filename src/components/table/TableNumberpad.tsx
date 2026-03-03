import { useState, type MouseEvent } from 'react';
import { ChevronLeft } from 'lucide-react';

/**
 * POS Table Management - Number Pad Modal
 * 인원 선택 후 확인 시 onConfirm(guestCount) 호출
 */

type TableNumberpadProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (guestCount: number) => void;
  tableName: string;
};

export default function TableNumberpad({
  isOpen,
  onClose,
  onConfirm,
  tableName,
}: TableNumberpadProps) {
  if (!isOpen) return null;

  return (
    <NumberpadContent
      onClose={onClose}
      onConfirm={onConfirm}
      tableName={tableName}
    />
  );
}

type NumberpadContentProps = Omit<TableNumberpadProps, 'isOpen'>;

function NumberpadContent({ onClose, onConfirm, tableName }: NumberpadContentProps) {
  const [value, setValue] = useState('0');

  const handleNumber = (num: number) => {
    if (value === '0') setValue(num.toString());
    else if (value.length < 3) setValue(value + num);
  };

  const handleBackspace = () => {
    if (value.length === 1) setValue('0');
    else setValue(value.slice(0, -1));
  };

  const handleConfirm = () => {
    const count = parseInt(value, 10) || 0;
    if (count > 0) onConfirm(count);
    onClose();
  };

  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="table-numberpad-title"
    >
      <div
        className="bg-white rounded-2xl w-96 p-8 shadow-2xl text-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="table-numberpad-title" className="text-xl font-bold mb-6">
          테이블 : {tableName}
        </h2>

        <div className="flex justify-between items-end border-b-2 border-gray-100 pb-2 mb-8">
          <span className="text-4xl font-medium">{value}</span>
          <span className="text-2xl font-bold">명</span>
        </div>

        <div className="grid grid-cols-3 gap-y-6 gap-x-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleNumber(num)}
              className="text-2xl font-semibold hover:bg-gray-100 rounded-full h-14 w-14 flex items-center justify-center mx-auto transition active:bg-gray-200"
            >
              {num}
            </button>
          ))}
          <div className="h-14 w-14" />
          <button
            type="button"
            onClick={() => handleNumber(0)}
            className="text-2xl font-semibold hover:bg-gray-100 rounded-full h-14 w-14 flex items-center justify-center mx-auto transition active:bg-gray-200"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="text-2xl font-semibold hover:bg-gray-100 rounded-full h-14 w-14 flex items-center justify-center mx-auto transition active:bg-gray-200"
          >
            <ChevronLeft className="w-7 h-7" />
          </button>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-base hover:bg-gray-200 transition"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-3.5 bg-blue-500 text-white rounded-xl font-bold text-base hover:bg-blue-600 transition shadow-lg"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
