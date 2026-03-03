import { useEffect, useState } from 'react';

function formatElapsed(startTime: Date): string {
  const sec = Math.floor((Date.now() - startTime.getTime()) / 1000);
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatTimeAgo(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return '방금 전';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hour = Math.floor(min / 60);
  return `${hour}시간 전`;
}

export function useElapsedTime(startTime?: Date) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  return startTime ? formatElapsed(startTime) : '0:00';
}

export function useTimeAgo(date?: Date) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!date) return;

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 10000);

    return () => clearInterval(interval);
  }, [date]);

  return date ? formatTimeAgo(date) : '';
}
