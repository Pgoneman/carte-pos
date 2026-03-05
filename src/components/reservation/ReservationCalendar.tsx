import { useState, useEffect, useMemo } from 'react';
import { usePosStore } from '../../stores/posStore';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Plus,
  ChevronDown,
} from 'lucide-react';
import ReservationModal from './ReservationModal';

/**
 * ReservationCalendar Component
 * 동적 날짜 기반 달력 + 주간 뷰
 */

const DAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];
const DAY_LABELS = ['(일)', '(월)', '(화)', '(수)', '(목)', '(금)', '(토)'];

const hours = Array.from({ length: 24 }, (_, i) => {
  const period = i < 12 ? '오전' : '오후';
  const hour = i % 12 === 0 ? 12 : i % 12;
  return `${period} ${hour}:00`;
});

type CalendarDay = {
  date: number;
  isCurrentMonth: boolean;
  fullDate: Date;
};

type WeekHeaderItem = {
  date: string;
  day: string;
  color: string;
};

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay()); // 해당 주 일요일
  d.setHours(0, 0, 0, 0);
  return d;
}

function getCalendarDates(year: number, month: number): CalendarDay[][] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: CalendarDay[] = [];

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    days.push({ date: d, isCurrentMonth: false, fullDate: new Date(prevYear, prevMonth, d) });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: i, isCurrentMonth: true, fullDate: new Date(year, month, i) });
  }

  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  let nextDay = 1;
  while (days.length % 7 !== 0) {
    days.push({ date: nextDay, isCurrentMonth: false, fullDate: new Date(nextYear, nextMonth, nextDay++) });
  }

  const rows: CalendarDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    rows.push(days.slice(i, i + 7));
  }
  return rows;
}

function getWeekHeader(weekStart: Date): WeekHeaderItem[] {
  const DAY_COLORS = [
    'text-red-500',
    'text-gray-600',
    'text-gray-600',
    'text-gray-600',
    'text-gray-600',
    'text-gray-600',
    'text-blue-400',
  ];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return {
      date: `${d.getMonth() + 1}. ${d.getDate()}`,
      day: DAY_LABELS[d.getDay()],
      color: DAY_COLORS[d.getDay()],
    };
  });
}

function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return `${weekStart.getDate()}일(${DAYS_KO[weekStart.getDay()]}) ~ ${weekEnd.getDate()}일(${DAYS_KO[weekEnd.getDay()]})`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const ChickMascot = () => (
  <div className="relative w-16 h-20">
    <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-10">
      <div className="w-10 h-3 bg-white rounded-t-sm border border-gray-300" />
      <div className="w-8 h-5 bg-white mx-auto rounded-t-full border-l border-r border-gray-300" />
    </div>
    <div className="absolute top-6 w-14 h-12 bg-yellow-400 rounded-full border-2 border-yellow-500 mx-auto left-1/2 -translate-x-1/2">
      <div className="relative w-full h-full">
        <div className="absolute top-4 left-1 w-2 h-1 bg-pink-300 rounded-full opacity-60" />
        <div className="absolute top-4 right-1 w-2 h-1 bg-pink-300 rounded-full opacity-60" />
        <div className="absolute top-3 left-3 w-2 h-2 bg-black rounded-full" />
        <div className="absolute top-3 right-3 w-2 h-2 bg-black rounded-full" />
        <div
          className="absolute top-5 left-1/2 -translate-x-1/2 w-0 h-0
            border-l-4 border-r-4 border-t-4
            border-l-transparent border-r-transparent border-t-orange-500"
        />
      </div>
    </div>
    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-10 h-6 bg-green-600 rounded-b-lg border-2 border-green-700">
      <div className="w-full h-1 bg-green-700 mt-1" />
    </div>
    <div className="absolute bottom-0 left-3 w-3 h-2 bg-orange-500 rounded-full" />
    <div className="absolute bottom-0 right-3 w-3 h-2 bg-orange-500 rounded-full" />
  </div>
);

export default function ReservationCalendar() {
  const today = new Date();

  const [viewMonth, setViewMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  const isReservationModalOpen = usePosStore((s) => s.isReservationModalOpen);
  const openReservationModal = usePosStore((s) => s.openReservationModal);
  const closeReservationModal = usePosStore((s) => s.closeReservationModal);
  const fetchReservations = usePosStore((s) => s.fetchReservations);
  const reservations = usePosStore((s) => s.reservations);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // 현재 시간 1분마다 갱신 (시간 표시선)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const calendarDates = getCalendarDates(viewMonth.year, viewMonth.month);
  const weekHeader = getWeekHeader(weekStart);
  const timeTopPx = currentTime.getHours() * 64 + (currentTime.getMinutes() / 60) * 64;
  const timeLabel = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;

  // 현재 주에 해당하는 예약만 필터링
  const weekReservations = useMemo(() => {
    const wEnd = new Date(weekStart);
    wEnd.setDate(wEnd.getDate() + 7);
    return reservations.filter((r) => {
      const d = new Date(r.reservationDate);
      return d >= weekStart && d < wEnd && r.status !== 'cancelled';
    });
  }, [reservations, weekStart]);

  // 요일별(0~6) 그룹핑
  const reservationsByDay = useMemo(() => {
    const byDay: Record<number, typeof reservations> = {};
    weekReservations.forEach((r) => {
      const d = new Date(r.reservationDate);
      const dayIdx = Math.floor(
        (d.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (dayIdx >= 0 && dayIdx < 7) {
        if (!byDay[dayIdx]) byDay[dayIdx] = [];
        byDay[dayIdx].push(r);
      }
    });
    return byDay;
  }, [weekReservations, weekStart]);

  const handlePrevMonth = () =>
    setViewMonth(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );

  const handleNextMonth = () =>
    setViewMonth(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );

  const handlePrevWeek = () =>
    setWeekStart((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() - 7);
      return next;
    });

  const handleNextWeek = () =>
    setWeekStart((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + 7);
      return next;
    });

  const handleTodayClick = () => {
    const now = new Date();
    setViewMonth({ year: now.getFullYear(), month: now.getMonth() });
    setWeekStart(getWeekStart(now));
    setSelectedDate(now);
  };

  const handleDayClick = (day: CalendarDay) => {
    setSelectedDate(day.fullDate);
    setWeekStart(getWeekStart(day.fullDate));
    if (!day.isCurrentMonth) {
      setViewMonth({ year: day.fullDate.getFullYear(), month: day.fullDate.getMonth() });
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 w-full bg-white font-sans text-gray-800 overflow-hidden">
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button className="text-gray-400 hover:text-gray-600" type="button" onClick={handlePrevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold">
                  {viewMonth.year}년 {viewMonth.month + 1}월
                </span>
                <button
                  className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full border border-blue-200"
                  type="button"
                  onClick={handleTodayClick}
                >
                  오늘
                </button>
              </div>
              <button className="text-gray-400 hover:text-gray-600" type="button" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center mb-2">
              {DAYS_KO.map((day, idx) => (
                <span
                  key={day}
                  className={`text-xs font-medium ${idx === 0 ? 'text-red-500' : 'text-gray-400'}`}
                >
                  {day}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 text-center gap-y-1">
              {calendarDates.flat().map((day) => {
                const isSelected = day.isCurrentMonth && isSameDay(day.fullDate, selectedDate);
                const isToday = day.isCurrentMonth && isSameDay(day.fullDate, today);
                const isSun = day.fullDate.getDay() === 0;
                return (
                  <div key={day.fullDate.toISOString()} className="flex items-center justify-center h-8">
                    <span
                      onClick={() => handleDayClick(day)}
                      onKeyDown={(e) => e.key === 'Enter' && handleDayClick(day)}
                      role="button"
                      tabIndex={0}
                      className={`text-xs w-7 h-7 flex items-center justify-center rounded-full cursor-pointer transition-colors ${
                        !day.isCurrentMonth
                          ? 'text-gray-300'
                          : isSelected
                          ? 'bg-blue-600 text-white'
                          : isToday
                          ? 'border border-blue-400 text-blue-600'
                          : isSun
                          ? 'text-red-500 hover:bg-red-50'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-auto p-4">
            <button
              className="w-full py-2 text-sm text-blue-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              의견 보내기
            </button>
          </div>
        </aside>

        {/* Main Calendar View */}
        <main className="flex-1 flex flex-col bg-gray-50 relative overflow-hidden min-h-0">
          <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-gray-200 shrink-0">
            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-600" type="button" onClick={handlePrevWeek}>
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold">
                {formatWeekRange(weekStart)}{' '}
                <span className="text-gray-400 font-normal ml-1">총 {weekReservations.length}건</span>
              </h2>
              <button className="text-gray-400 hover:text-gray-600" type="button" onClick={handleNextWeek}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100"
                type="button"
              >
                <span>테이블 전체</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <button
                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100"
                type="button"
              >
                <span>주</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600" type="button">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </header>

          {/* Calendar Grid Container */}
          <div className="flex-1 overflow-y-auto relative min-h-0">
            <div className="min-w-[800px] h-full flex flex-col min-h-[400px]">
              {/* Day Headers */}
              <div className="flex border-b border-gray-200 bg-white sticky top-0 z-20">
                <div className="w-20 shrink-0" />
                {weekHeader.map((item) => (
                  <div key={item.date} className="flex-1 py-3 text-center border-l border-gray-100">
                    <span className={`text-xs font-medium ${item.color}`}>
                      {item.date} {item.day}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="flex flex-1 relative min-h-0">
                <div className="w-20 shrink-0 bg-white">
                  {hours.map((label, idx) => (
                    <div key={idx} className="h-16 flex items-start justify-end pr-3 -mt-2">
                      <span className="text-xs text-gray-400 whitespace-nowrap">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 grid grid-cols-7 relative">
                  {Array.from({ length: 7 }).map((_, colIdx) => (
                    <div key={colIdx} className="border-l border-gray-200 h-full relative">
                      {hours.map((_, rowIdx) => (
                        <div
                          key={rowIdx}
                          className="h-16 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                        />
                      ))}
                      {(reservationsByDay[colIdx] ?? []).map((r) => {
                        const d = new Date(r.reservationDate);
                        const topPx = d.getHours() * 64 + (d.getMinutes() / 60) * 64;
                        const timeStr = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
                        return (
                          <div
                            key={r.id}
                            className="absolute left-0.5 right-0.5 rounded bg-blue-100 border-l-2 border-blue-500 px-1.5 py-0.5 text-xs overflow-hidden cursor-pointer hover:bg-blue-200 transition-colors z-10"
                            style={{ top: `${topPx}px`, height: '60px' }}
                            title={`${r.customerName} ${r.guests}명 ${timeStr}`}
                          >
                            <div className="font-bold text-blue-800 truncate">{r.customerName}</div>
                            <div className="text-blue-600 truncate">{r.guests}명 · {timeStr}</div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* 현재 시간 표시선 */}
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none flex items-center"
                    style={{ top: `${timeTopPx}px` }}
                  >
                    <div className="absolute -left-20 w-20 flex justify-end pr-2">
                      <div className="bg-blue-100 text-blue-600 text-xs font-bold px-1.5 py-0.5 rounded-full border border-blue-200">
                        {timeLabel}
                      </div>
                    </div>
                    <div className="flex-1 h-0.5 bg-blue-400 relative">
                      <div className="absolute left-0 -top-1 w-2.5 h-2.5 bg-blue-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="absolute bottom-6 right-6 flex flex-col items-center space-y-4 z-30">
            <ChickMascot />
            <button
              type="button"
              onClick={openReservationModal}
              className="w-14 h-14 bg-blue-500 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-600 transition-colors"
              aria-label="예약 등록"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
        </main>
      </div>

      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={closeReservationModal}
      />
    </div>
  );
}
