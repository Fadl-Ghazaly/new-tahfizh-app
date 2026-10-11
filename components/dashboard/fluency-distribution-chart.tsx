'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FluencyStatsData } from '@/lib/queries/dashboard';

export function FluencyDistributionChart({ data }: { data: FluencyStatsData }) {
  const chartData = [
    { name: 'Sangat Lancar (>=90)', current: data.currentMonth.excellent, prev: data.prevMonth.excellent, color: '#10B981' },
    { name: 'Lancar (75-89)', current: data.currentMonth.good, prev: data.prevMonth.good, color: '#EAB308' },
    { name: 'Perlu Bimbingan (<75)', current: data.currentMonth.needs_work, prev: data.prevMonth.needs_work, color: '#EF4444' },
  ];

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          barGap={8}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#64748B' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
          <Bar name="Bulan Ini" dataKey="current" fill="#10B981" radius={[4, 4, 0, 0]} barSize={32} />
          <Bar name="Bulan Lalu" dataKey="prev" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
