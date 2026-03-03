import React, { useState } from 'react';
import {
  X,
  Calendar,
  Plus,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react';
import { usePosStore } from '../../stores/posStore';

/**
 * POS Reservation System - Reservation Modal
 * Light theme with reservation form (예약자 정보, 날짜·시간, 인원, 테이블, 상품)
 */

const peopleCounts = [
  '1명',
  '2명',
  '3명',
  '4명',
  '5명',
  '6명',
  '7명',
  '8명',
  '직접입력 >',
];

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

function formatDateKo(date: Date): string {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const day = DAYS_KO[date.getDay()];
  return `${date.getFullYear()}. ${m}. ${d} ${day}`;
}

function formatTimeKo(date: Date): string {
  const h = date.getHours();
  const period = h < 12 ? '오전' : '오후';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${period} ${String(hour).padStart(2, '0')}:00`;
}

function getDefaultReservationDate(): Date {
  const now = new Date();
  // 다음 정시를 기본값으로 (예: 14:20 → 15:00)
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now;
}

type ReservationModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ReservationModal({
  isOpen,
  onClose,
}: ReservationModalProps) {
  const [selectedPeople, setSelectedPeople] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reservationDate, setReservationDate] = useState<Date>(getDefaultReservationDate);
  const createReservation = usePosStore((s) => s.createReservation);
  const loading = usePosStore((s) => s.loading);

  if (!isOpen) return null;

  const endDate = new Date(reservationDate.getTime() + 60 * 60 * 1000);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleHourChange = (delta: number) => {
    const next = new Date(reservationDate.getTime() + delta * 60 * 60 * 1000);
    setReservationDate(next);
  };

  const handleRegister = async () => {
    if (!customerName.trim() || !phoneNumber.trim()) {
      alert('예약자 이름과 연락처를 입력해주세요.');
      return;
    }

    const success = await createReservation({
      customerName,
      phoneNumber,
      reservationDate: reservationDate.toISOString(),
      guests: selectedPeople + 1,
      tableId: null,
    });

    if (success) {
      setCustomerName('');
      setPhoneNumber('');
      setSelectedPeople(0);
      setReservationDate(getDefaultReservationDate());
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reservation-modal-title"
    >
      <div
        className="bg-white w-[560px] max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b-0">
          <h2
            id="reservation-modal-title"
            className="text-lg font-bold text-gray-800"
          >
            {reservationDate.getMonth() + 1}월 {reservationDate.getDate()}일 예약
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label="닫기"
          >
            <X size={22} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {/* 예약자 정보 */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              예약자 정보
            </label>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="이름"
                className="flex-1 p-3 text-sm outline-none border-r border-gray-200 focus:bg-gray-50"
              />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="010-0000-0000 (필수)"
                className="flex-[2] p-3 text-sm outline-none focus:bg-gray-50"
              />
            </div>
          </div>

          {/* 날짜 · 시간 */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-semibold text-gray-700">
                날짜 · 시간 <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center text-xs text-gray-500 cursor-pointer">
                <CheckCircle2 size={14} className="mr-1 text-gray-300" />
                <span>영업시간 외 예약 (24시간 중 선택)</span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="flex-[1.5] flex items-center justify-between border border-gray-200 rounded-lg p-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span>{formatDateKo(reservationDate)}</span>
                <Calendar size={14} className="text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => handleHourChange(-1)}
                className="flex-1 flex items-center justify-between border border-gray-200 rounded-lg p-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span>{formatTimeKo(reservationDate)}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
              <span className="text-gray-400">~</span>
              <button
                type="button"
                onClick={() => handleHourChange(1)}
                className="flex-1 flex items-center justify-between border border-gray-200 rounded-lg p-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span>{formatTimeKo(endDate)}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>
            </div>
          </div>

          {/* 인원 */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              인원
            </label>
            <div className="flex flex-wrap gap-2">
              {peopleCounts.map((count: string, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedPeople(i)}
                  className={`px-3 py-2 text-sm rounded border transition-colors ${selectedPeople === i
                      ? 'bg-blue-50 border-blue-500 text-blue-600 font-medium'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                    }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* 테이블 */}
          <div className="mb-5">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <label className="text-sm font-semibold text-gray-700">
                  테이블
                </label>
                <span className="text-xs text-gray-400 ml-2">
                  인원 수에 따라 테이블이 자동 지정돼요
                </span>
              </div>
              <button
                type="button"
                className="text-xs text-gray-500 hover:underline"
              >
                테이블 인원 설정하기 &gt;
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded border bg-blue-50 border-blue-500 text-blue-600 font-medium"
              >
                미지정
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded border bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                직접 등록 &gt;
              </button>
            </div>
          </div>

          {/* 상품 */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              상품 <span className="text-gray-400 font-normal">총 0원</span>
            </label>
            <button
              type="button"
              className="w-full py-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-sm text-gray-400 hover:bg-gray-100 flex items-center justify-center"
            >
              추가 <Plus size={14} className="ml-1" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-600 cursor-pointer">
            <CheckCircle2 size={18} className="mr-2 text-gray-300" />
            <span>확정 알림톡 발송 (무료)</span>
          </div>
          <button
            type="button"
            onClick={handleRegister}
            disabled={loading}
            className="bg-blue-500 text-white px-10 py-3 rounded-xl font-bold text-base hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? '등록 중...' : '예약 등록'}
          </button>
        </div>
      </div>
    </div>
  );
}
