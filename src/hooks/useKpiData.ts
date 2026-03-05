import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { KpiDashboardData, WeeklyDataPoint } from '../types/kpi';

export function useKpiData(): { data: KpiDashboardData | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<KpiDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchKpiData() {
      try {
        // 1. order_sessions에서 DAU 계산
        const { data: sessions, error: sessionsError } = await supabase
          .from('order_sessions')
          .select('id, created_at, settled, settled_at, ayce_plan_id')
          .order('created_at', { ascending: false });

        if (sessionsError) throw sessionsError;

        // 2. payments에서 결제 완료 시간 계산
        const { data: payments, error: paymentsError } = await supabase
          .from('payments')
          .select('id, created_at, amount, tip_amount')
          .order('created_at', { ascending: false });

        if (paymentsError) throw paymentsError;

        // 3. 메트릭 계산 (MVP 단계 — 데이터 적으면 mock과 혼합)
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const thisWeekSessions = sessions?.filter(s => new Date(s.created_at) > oneWeekAgo) || [];
        const lastWeekSessions = sessions?.filter(s => {
          const d = new Date(s.created_at);
          return d > twoWeeksAgo && d <= oneWeekAgo;
        }) || [];

        // DAU 계산 (이번 주 일평균 세션 수)
        const dauThis = thisWeekSessions.length / 7 || 0;
        const dauLast = lastWeekSessions.length / 7 || 0;
        const dauChange = dauLast > 0 ? ((dauThis - dauLast) / dauLast) * 100 : 0;

        // Activation Rate (주문 → 결제 완료 비율)
        const settledThis = thisWeekSessions.filter(s => s.settled).length;
        const activationThis = thisWeekSessions.length > 0
          ? (settledThis / thisWeekSessions.length) * 100 : 0;
        const settledLast = lastWeekSessions.filter(s => s.settled).length;
        const activationLast = lastWeekSessions.length > 0
          ? (settledLast / lastWeekSessions.length) * 100 : 0;
        const activationChange = activationLast > 0
          ? ((activationThis - activationLast) / activationLast) * 100 : 0;

        // 결제 시간 계산 (North Star)
        const settledWithTime = (sessions || []).filter(s => s.settled && s.settled_at);
        let avgPaymentTime = 360; // 기본 6분 (초)
        if (settledWithTime.length > 0) {
          const times = settledWithTime.map(s => {
            const start = new Date(s.created_at).getTime();
            const end = new Date(s.settled_at).getTime();
            return (end - start) / 1000;
          });
          avgPaymentTime = times.reduce((a, b) => a + b, 0) / times.length;
        }

        // payments is used for future metrics expansion
        void payments;

        const kpiData: KpiDashboardData = {
          metrics: {
            dau: {
              label: 'DAU (일 평균 세션)',
              value: Math.round(dauThis * 10) / 10,
              unit: '건',
              change: Math.round(dauChange),
              trend: dauChange > 0 ? 'up' : dauChange < 0 ? 'down' : 'flat',
              isPositive: true,
            },
            activationRate: {
              label: '활성화율 (주문→결제)',
              value: Math.round(activationThis),
              unit: '%',
              change: Math.round(activationChange),
              trend: activationChange > 0 ? 'up' : activationChange < 0 ? 'down' : 'flat',
              isPositive: true,
            },
            retentionD7: {
              label: 'D7 리텐션',
              value: 0,
              unit: '%',
              change: 0,
              trend: 'flat',
              isPositive: true,
            },
            offerConversion: {
              label: '오퍼 전환율',
              value: 0,
              unit: '%',
              change: 0,
              trend: 'flat',
              isPositive: true,
            },
          },
          weeklyTrend: generateWeeklyMockData(),
          northStar: {
            current: Math.round(avgPaymentTime),
            target: 120,
            unit: '초',
          },
          goDecision: {
            pilotsCommitted: 1,
            pilotsTarget: 3,
            status: 'pending',
          },
        };

        setData(kpiData);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setData(generateMockKpiData());
      } finally {
        setLoading(false);
      }
    }

    fetchKpiData();
  }, []);

  return { data, loading, error };
}

function generateWeeklyMockData(): WeeklyDataPoint[] {
  return [
    { week: 'W1', date: '2/17', dau: 2, activationRate: 45, retentionD7: 0, offerConversion: 0 },
    { week: 'W2', date: '2/24', dau: 5, activationRate: 62, retentionD7: 30, offerConversion: 10 },
    { week: 'W3', date: '3/3', dau: 8, activationRate: 71, retentionD7: 45, offerConversion: 20 },
  ];
}

function generateMockKpiData(): KpiDashboardData {
  return {
    metrics: {
      dau: { label: 'DAU', value: 8, unit: '건', change: 60, trend: 'up', isPositive: true },
      activationRate: { label: '활성화율', value: 71, unit: '%', change: 15, trend: 'up', isPositive: true },
      retentionD7: { label: 'D7 리텐션', value: 45, unit: '%', change: 50, trend: 'up', isPositive: true },
      offerConversion: { label: '오퍼 전환율', value: 20, unit: '%', change: 100, trend: 'up', isPositive: true },
    },
    weeklyTrend: generateWeeklyMockData(),
    northStar: { current: 360, target: 120, unit: '초' },
    goDecision: { pilotsCommitted: 1, pilotsTarget: 3, status: 'pending' },
  };
}
