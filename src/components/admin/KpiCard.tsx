import type { KpiMetric } from '../../types/kpi';

interface KpiCardProps {
  metric: KpiMetric;
}

export function KpiCard({ metric }: KpiCardProps) {
  const trendColor = metric.trend === 'flat' ? 'text-gray-400'
    : (metric.trend === 'up') === metric.isPositive
      ? 'text-green-500' : 'text-red-500';

  const trendIcon = metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→';

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p className="text-sm text-brand-muted font-body mb-1">{metric.label}</p>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-brand-dark font-display">
          {metric.value}
        </span>
        <span className="text-lg text-brand-muted mb-1">{metric.unit}</span>
      </div>
      <div className={`flex items-center gap-1 mt-2 text-sm ${trendColor}`}>
        <span>{trendIcon}</span>
        <span>{metric.change > 0 ? '+' : ''}{metric.change}% vs 전주</span>
      </div>
    </div>
  );
}
