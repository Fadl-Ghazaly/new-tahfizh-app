'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { JuzDistributionData } from '@/lib/queries/dashboard';

export function JuzDistributionChart({ data }: { data: JuzDistributionData }) {
  const chartData = [
    { name: 'Kurang dari 2 juz', value: data.group_0_1, color: '#94A3B8' },
    { name: '2 - 5 juz', value: data.group_2_5, color: '#3B82F6' },
    { name: '6 - 10 juz', value: data.group_6_10, color: '#8B5CF6' },
    { name: '11 - 20 juz', value: data.group_11_20, color: '#EC4899' },
    { name: '21 - 30 juz', value: data.group_21_30, color: '#10B981' },
  ];

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            axisLine={false} 
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
            width={100}
          />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            formatter={(value) => [`${Number(value ?? 0)} Santri`, 'Jumlah']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
