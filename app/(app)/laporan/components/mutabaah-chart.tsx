'use client';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { DailyChartPoint } from '@/lib/laporan/types';

export interface MutabaahChartProps {
  data: DailyChartPoint[];
}

export function MutabaahChart({ data }: MutabaahChartProps) {
  const hasData = data.some((d) => d.sabaq > 0 || d.sabqi > 0 || d.manzil > 0);

  if (!hasData) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
        Belum ada aktivitas setoran pada periode ini.
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="day" tickLine={false} tick={{ fontSize: 11 }} />
          <YAxis tickLine={false} tick={{ fontSize: 11 }} />
          <Tooltip
            formatter={(value: unknown) => [`${value} baris`]}
            labelFormatter={(label) => `Tanggal ${label}`}
            contentStyle={{
              backgroundColor: 'var(--popover)',
              borderColor: 'var(--border)',
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
          <Bar dataKey="sabaq" name="Sabaq" fill="#059669" radius={[2, 2, 0, 0]} />
          <Bar dataKey="sabqi" name="Sabqi" fill="#2563eb" radius={[2, 2, 0, 0]} />
          <Bar dataKey="manzil" name="Manzil" fill="#d97706" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

