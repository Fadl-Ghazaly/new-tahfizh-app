'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { ClassProgressItem } from '@/lib/queries/dashboard';

export function ClassProgressChart({ data }: { data: ClassProgressItem[] }) {
  const chartData = data.map(item => ({
    name: item.class_name,
    current: item.current_sabaq_lines,
    prev: item.prev_sabaq_lines,
  }));

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="name" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value) => [`${Number(value ?? 0).toLocaleString('id-ID')} Baris`, 'Capaian']}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
          <Bar name="Bulan Ini" dataKey="current" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
          <Bar name="Bulan Lalu" dataKey="prev" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
