import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import type { WeeklyDataPoint } from '../../types/kpi';

interface WeeklyTrendChartProps {
  data: WeeklyDataPoint[];
}

export function WeeklyTrendChart({ data }: WeeklyTrendChartProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-brand-dark font-display mb-4">
        주간 트렌드
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0ebe6" />
          <XAxis dataKey="date" stroke="#9A8070" fontSize={12} />
          <YAxis stroke="#9A8070" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1A0F0A',
              border: 'none',
              borderRadius: '12px',
              color: '#F5F0EB',
              fontFamily: 'DM Sans',
            }}
          />
          <Legend />
          <Line
            type="monotone" dataKey="dau" name="DAU"
            stroke="#E8341A" strokeWidth={2} dot={{ r: 4 }}
          />
          <Line
            type="monotone" dataKey="activationRate" name="활성화율(%)"
            stroke="#FF6B3D" strokeWidth={2} dot={{ r: 4 }}
          />
          <Line
            type="monotone" dataKey="retentionD7" name="D7 리텐션(%)"
            stroke="#4A3728" strokeWidth={2} dot={{ r: 4 }}
          />
          <Line
            type="monotone" dataKey="offerConversion" name="오퍼 전환(%)"
            stroke="#B89880" strokeWidth={2} dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
