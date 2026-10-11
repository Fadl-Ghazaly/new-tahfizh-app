'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TargetAchievementData } from '@/lib/queries/dashboard';

export function TargetAchievementPie({ data }: { data: TargetAchievementData }) {
  const chartData = [
    { name: 'Tercapai', value: data.total_lines },
    { name: 'Sisa Target', value: data.remaining_lines },
  ];

  const COLORS = ['#10B981', '#F1F5F9'];

  return (
    <div className="h-[250px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${Number(value ?? 0).toLocaleString('id-ID')} Baris`}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-slate-900">{data.percentage}%</span>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Tercapai</span>
      </div>
    </div>
  );
}
