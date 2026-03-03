import { useState, useEffect } from 'react';

const WEEKDAY = ['일', '월', '화', '수', '목', '금', '토'] as const;

function formatDateWithTime(date: Date) {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = WEEKDAY[date.getDay()];
    const hour = date.getHours();
    const minute = date.getMinutes();
    const ampm = hour < 12 ? '오전' : '오후';
    const hour12 = hour % 12 || 12;
    const minStr = minute.toString().padStart(2, '0');
    return `${month}.${day}. (${weekday}) ${ampm} ${hour12}:${minStr}`;
}

export function useClock() {
    const [dateTime, setDateTime] = useState(() => formatDateWithTime(new Date()));

    useEffect(() => {
        const timer = setInterval(() => {
            setDateTime(formatDateWithTime(new Date()));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return dateTime;
}
