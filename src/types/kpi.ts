export interface KpiMetric {
  label: string;
  value: number;
  unit: string;           // '%', '명', '초', '건' 등
  change: number;         // 전주 대비 변화율 (%)
  trend: 'up' | 'down' | 'flat';
  isPositive: boolean;    // 상승이 좋은 지표인지
}

export interface WeeklyDataPoint {
  week: string;           // 'W1', 'W2', ...
  date: string;           // '3/1' 형태
  dau: number;
  activationRate: number;
  retentionD7: number;
  offerConversion: number;
}

export interface KpiDashboardData {
  metrics: {
    dau: KpiMetric;
    activationRate: KpiMetric;
    retentionD7: KpiMetric;
    offerConversion: KpiMetric;
  };
  weeklyTrend: WeeklyDataPoint[];
  northStar: {
    current: number;      // 현재 결제 소요 시간 (초)
    target: number;       // 목표
    unit: string;
  };
  goDecision: {
    pilotsCommitted: number;
    pilotsTarget: number;
    status: 'go' | 'pivot' | 'kill' | 'pending';
  };
}
