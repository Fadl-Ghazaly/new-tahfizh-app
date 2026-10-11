'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DailyStatItem } from '@/lib/dashboard-utils';

interface Props {
  currentMonthStats: DailyStatItem[];
  prevMonthStats: DailyStatItem[];
}

export function DailyMemorizationChart({ currentMonthStats, prevMonthStats }: Props) {
  const hasData = currentMonthStats.some(s => s.total > 0) || prevMonthStats.some(s => s.total > 0);

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <p className="text-sm text-slate-400">Belum ada data setoran untuk ditampilkan</p>
      </div>
    );
  }

  // Format data for Recharts
  const data = currentMonthStats.map((curr, idx) => {
    const prev = prevMonthStats[idx];
    return {
      day: curr.day,
      sabaq: curr.sabaq,
      sabqi: curr.sabqi,
      manzil: curr.manzil,
      total: curr.total,
      prevTotal: prev ? prev.total : 0,
    };
  });

  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSabaq" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSabqi" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorManzil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis 
            dataKey="day" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
            interval={2}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#64748B' }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            labelFormatter={(day) => `Tanggal ${day}`}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }} />
          <Area
            name="Sabaq (Baru)"
            type="monotone"
            dataKey="sabaq"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#colorSabaq)"
            strokeWidth={2}
            stackId="1"
          />
          <Area
            name="Sabqi (Dekat)"
            type="monotone"
            dataKey="sabqi"
            stroke="#3B82F6"
            fillOpacity={1}
            fill="url(#colorSabqi)"
            strokeWidth={2}
            stackId="1"
          />
          <Area
            name="Manzil (Lama)"
            type="monotone"
            dataKey="manzil"
            stroke="#F59E0B"
            fillOpacity={1}
            fill="url(#colorManzil)"
            strokeWidth={2}
            stackId="1"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
