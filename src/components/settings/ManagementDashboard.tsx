import React from 'react';
import {
  X,
  ChevronRight,
  BarChart3,
  Package,
  Zap,
  Monitor,
  Megaphone,
  Settings,
} from 'lucide-react';
import MenuUpload from './MenuUpload';

/**
 * POS Management Dashboard / Settings Menu
 * Sidebar (drawer) – 왼쪽에서 슬라이드 인, 햄버거 메뉴로 열림
 */

const ChickMascot = () => (
  <div className="relative w-20 h-24">
    <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
      <div className="w-14 h-3.5 bg-white rounded-t-sm border border-gray-300" />
      <div className="w-11 h-6 bg-white mx-auto rounded-t-full border-l border-r border-gray-300" />
    </div>

    <div className="absolute top-7 w-16 h-14 bg-yellow-400 rounded-full border-2 border-yellow-500 mx-auto left-1/2 -translate-x-1/2">
      <div className="relative w-full h-full">
        <div className="absolute top-5 left-1 w-2.5 h-1.5 bg-pink-300 rounded-full opacity-60" />
        <div className="absolute top-5 right-1 w-2.5 h-1.5 bg-pink-300 rounded-full opacity-60" />
        <div className="absolute top-4 left-4 w-2 h-2 bg-black rounded-full" />
        <div className="absolute top-4 right-4 w-2 h-2 bg-black rounded-full" />
        <div
          className="absolute top-7 left-1/2 -translate-x-1/2 w-0 h-0 
            border-l-[5px] border-r-[5px] border-t-[5px] 
            border-l-transparent border-r-transparent border-t-orange-500"
        />
      </div>
    </div>

    <div className="absolute top-14 left-1/2 -translate-x-1/2 w-12 h-8 bg-green-700 rounded-b-xl border-2 border-green-800">
      <div className="w-full h-1 bg-green-800 mt-1" />
    </div>

    <div className="absolute bottom-0 left-4 w-4 h-2 bg-orange-500 rounded-full" />
    <div className="absolute bottom-0 right-4 w-4 h-2 bg-orange-500 rounded-full" />
  </div>
);

type CategoryItem =
  | string
  | {
      text: string;
      suffix?: string;
      badge?: string;
      badgeColor?: string;
    };

type DashboardCategory = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: CategoryItem[];
};

const categories: DashboardCategory[] = [
  {
    icon: BarChart3,
    title: '매출',
    items: ['결제내역', '시재 관리', '매출 리포트'],
  },
  {
    icon: Package,
    title: '상품',
    items: ['상품 · 할인', '선불권', '재고 관리'],
  },
  {
    icon: Zap,
    title: '편의',
    items: [
      { text: '전화주문 연동', suffix: 'CID' },
      '퀵서비스',
    ],
  },
  {
    icon: Monitor,
    title: '채널',
    items: ['키오스크', '테이블주문'],
  },
  {
    icon: Megaphone,
    title: '마케팅',
    items: [
      '고객정보',
      '포인트 · 스탬프',
      {
        text: '쿠폰 · 메시지',
        badge: '무료혜택',
        badgeColor: 'bg-red-50 text-red-500 border-red-100',
      },
      '토스 지원 할인 · 이벤트',
    ],
  },
  {
    icon: Settings,
    title: '설정',
    items: [
      '프론트 · 프린터 연결',
      '고객용 배경화면',
      '영수증 · 주문서',
      '기타 설정',
    ],
  },
];

type ManagementDashboardProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ManagementDashboard({
  isOpen,
  onClose,
}: ManagementDashboardProps) {
  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* 오버레이: 반투명 검은 배경, 클릭 시 닫기 */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleOverlayClick}
        aria-hidden
      />

      {/* 사이드바: 왼쪽에서 슬라이드 인, 흰 배경 */}
      <aside
        className="fixed left-0 top-0 h-full w-[350px] max-w-[90vw] bg-white shadow-2xl z-50 flex flex-col overflow-hidden"
        style={{ animation: 'slideInLeft 0.2s ease-out' }}
        role="dialog"
        aria-modal="true"
        aria-label="관리 메뉴"
      >
        {/* 상단: 닫기 버튼 */}
        <div className="flex justify-end items-center p-4 border-b border-gray-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 스크롤 영역: 헤더 + 카테고리 그리드 + 마스코트 */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Header Section */}
          <header className="flex flex-col space-y-4 mb-10">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                <span className="text-3xl">🍳</span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">
                  바이오테크
                </h1>
                <button
                  type="button"
                  className="text-sm text-gray-500 flex items-center mt-1 hover:underline"
                >
                  매장 페이지{' '}
                  <ChevronRight className="w-4 h-4 ml-0.5 shrink-0" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="flex items-center bg-blue-50 text-blue-500 px-3 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100 transition-colors"
              >
                포스 시작하기
                <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                  8/8
                </span>
              </button>
              <button
                type="button"
                className="flex items-center bg-blue-50 text-blue-500 px-3 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100 transition-colors"
              >
                단말기 알아보기
                <span className="ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded">
                  최저가
                </span>
              </button>
              <button
                type="button"
                className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg font-semibold text-sm border border-gray-200 hover:bg-gray-200 transition-colors"
              >
                고객센터
              </button>
            </div>
          </header>

          {/* 메뉴 엑셀 업로드 */}
          <section className="mb-8">
            <MenuUpload />
          </section>

          {/* Grid of Categories */}
          <div className="space-y-10">
            {categories.map((category, idx) => {
              const IconComponent = category.icon;
              return (
                <section key={idx}>
                  <div className="flex items-center space-x-2 mb-4">
                    <IconComponent className="w-5 h-5 text-gray-400 shrink-0" />
                    <h2 className="text-base font-bold text-gray-700">
                      {category.title}
                    </h2>
                  </div>
                  <ul className="space-y-3 pl-7 border-l border-gray-100">
                    {category.items.map((item, itemIdx) => {
                      const isObject = typeof item === 'object';
                      const text = isObject ? item.text : item;
                      const suffix = isObject ? item.suffix : null;
                      const badge = isObject ? item.badge : null;
                      const badgeColor = isObject ? item.badgeColor : null;

                      return (
                        <li key={itemIdx}>
                          <button
                            type="button"
                            className="text-gray-600 hover:text-blue-600 transition-colors font-medium flex items-center flex-wrap gap-1"
                          >
                            {text}
                            {suffix && (
                              <span className="text-gray-400 font-normal">
                                {suffix}
                              </span>
                            )}
                            {badge && (
                              <span
                                className={`${badgeColor ?? ''} text-xs px-1.5 py-0.5 rounded border font-bold`}
                              >
                                {badge}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>

          {/* Chick Mascot */}
          <div className="mt-10 pt-6 border-t border-gray-100 flex justify-center">
            <ChickMascot />
          </div>
        </div>
      </aside>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}}></style>
    </>
  );
}
