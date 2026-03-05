import { useKpiData } from '../hooks/useKpiData';
import { KpiCard } from '../components/admin/KpiCard';
import { WeeklyTrendChart } from '../components/admin/WeeklyTrendChart';

export default function KpiDashboardPage() {
  const { data, loading } = useKpiData();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <p className="text-brand-muted">데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const goStatusColor = {
    go: 'bg-green-100 text-green-800',
    pivot: 'bg-yellow-100 text-yellow-800',
    kill: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-800',
  }[data.goDecision.status];

  return (
    <div className="min-h-screen bg-brand-cream">
      {/* Header */}
      <header className="bg-brand-dark text-brand-cream px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display">Carte KPI Dashboard</h1>
            <p className="text-brand-brown-light text-sm font-body">
              MVP 가설 검증 트래커
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-bold ${goStatusColor}`}>
            {data.goDecision.status.toUpperCase()}
          </span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* North Star Metric */}
        <div className="bg-brand-dark rounded-2xl p-6 text-brand-cream">
          <p className="text-brand-brown-light text-sm font-body mb-1">
            North Star Metric -- 테이블 결제 소요 시간
          </p>
          <div className="flex items-end gap-4">
            <span className="text-5xl font-display font-bold">
              {data.northStar.current}
            </span>
            <span className="text-xl text-brand-brown-light mb-2">
              {data.northStar.unit}
            </span>
            <span className="text-brand-brown-light mb-2">목표</span>
            <span className="text-3xl font-display text-brand-red-light font-bold mb-0">
              {data.northStar.target}{data.northStar.unit}
            </span>
          </div>
          <div className="mt-3 bg-brand-warm rounded-full h-3 overflow-hidden">
            <div
              className="bg-brand-red h-full rounded-full transition-all duration-1000"
              style={{
                width: `${Math.min(100, ((data.northStar.current - data.northStar.target) /
                  (360 - data.northStar.target)) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* AARRR KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard metric={data.metrics.dau} />
          <KpiCard metric={data.metrics.activationRate} />
          <KpiCard metric={data.metrics.retentionD7} />
          <KpiCard metric={data.metrics.offerConversion} />
        </div>

        {/* Weekly Trend Chart */}
        <WeeklyTrendChart data={data.weeklyTrend} />

        {/* Go/Pivot/Kill Decision Box */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-brand-dark font-display mb-4">
            Go / Pivot / Kill 판단 기준
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="font-bold text-green-800 mb-1">GO</p>
              <p className="text-sm text-green-700">
                10곳 중 3곳 이상 파일럿 일정 확정
              </p>
              <p className="text-xs text-green-600 mt-2">
                현재: {data.goDecision.pilotsCommitted}/{data.goDecision.pilotsTarget}곳
              </p>
            </div>
            <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
              <p className="font-bold text-yellow-800 mb-1">PIVOT</p>
              <p className="text-sm text-yellow-700">
                관심은 있으나 전환 의사 없음 - 애드온 모델로 전환
              </p>
            </div>
            <div className="p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="font-bold text-red-800 mb-1">KILL</p>
              <p className="text-sm text-red-700">
                전혀 관심 없음 - 즉시 중단
              </p>
            </div>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-brand-dark font-display mb-4">
            세일즈 퍼널 (AARRR)
          </h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { label: 'DM 발송', value: '0', target: '30' },
              { label: '인터뷰', value: '0', target: '10' },
              { label: '데모 시연', value: '0', target: '5' },
              { label: '마피아 오퍼', value: '0', target: '5' },
              { label: '파일럿 확정', value: String(data.goDecision.pilotsCommitted), target: '3' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center">
                <div className="flex-shrink-0 text-center px-4 py-3 rounded-xl bg-brand-light min-w-[100px]">
                  <p className="text-xs text-brand-muted">{step.label}</p>
                  <p className="text-2xl font-bold text-brand-dark font-display">
                    {step.value}
                  </p>
                  <p className="text-xs text-brand-muted">목표 {step.target}</p>
                </div>
                {i < 4 && (
                  <span className="text-brand-muted mx-1 flex-shrink-0">&rarr;</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
