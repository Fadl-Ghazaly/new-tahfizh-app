'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { optionLabel, withUstadzTitle } from '@/lib/formatters';
import { INDONESIAN_MONTHS } from '@/lib/laporan/queries';
import {
  ClassFilterOption,
  TeacherFilterOption,
  StudentFilterOption,
  LaporanFilterParams,
} from '@/lib/laporan/types';

export interface FilterBarProps {
  role: 'ADMIN' | 'USTADZ';
  params: LaporanFilterParams;
  classes: ClassFilterOption[];
  teachers: TeacherFilterOption[];
  students: StudentFilterOption[];
  onParamChange: (newParams: Partial<Record<keyof LaporanFilterParams, string | number>>) => void;
}

export function FilterBar({
  role,
  params,
  classes,
  teachers,
  students,
  onParamChange,
}: FilterBarProps) {
  const monthOptions = INDONESIAN_MONTHS.map((name, idx) => ({
    value: String(idx + 1),
    label: name,
  }));

  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1].map((y) => ({
    value: String(y),
    label: String(y),
  }));

  const classOptions = [
    { value: 'all', label: 'Semua Kelas' },
    ...classes.map((c) => ({ value: String(c.level), label: `Kelas ${c.level}` })),
  ];

  const teacherOptions = [
    { value: 'all', label: 'Semua Ustadz' },
    ...teachers.map((t) => ({ value: t.id, label: withUstadzTitle(t.name) })),
  ];

  const studentOptions = students.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.className})`,
  }));

  return (
    <div className="bg-card p-4 rounded-xl border shadow-sm print:hidden">
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter Bulan */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Bulan</label>
          <Select
            value={String(params.month)}
            onValueChange={(val) => onParamChange({ month: parseInt(val || '1', 10) })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Pilih Bulan">
                {(val: string | null) => optionLabel(monthOptions, val, 'Pilih Bulan')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Tahun */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Tahun</label>
          <Select
            value={String(params.year)}
            onValueChange={(val) => onParamChange({ year: parseInt(val || String(currentYear), 10) })}
          >
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Pilih Tahun">
                {(val: string | null) => optionLabel(yearOptions, val, 'Pilih Tahun')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y.value} value={y.value}>
                  {y.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Kelas */}
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Kelas</label>
          <Select
            value={params.classLevel === 'all' ? 'all' : String(params.classLevel)}
            onValueChange={(val) => onParamChange({ classLevel: val || 'all' })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Semua Kelas">
                {(val: string | null) => optionLabel(classOptions, val, 'Semua Kelas')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {classOptions.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filter Ustadz (Khusus ADMIN) */}
        {role === 'ADMIN' && (
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Ustadz</label>
            <Select
              value={params.ustadzId}
              onValueChange={(val) => onParamChange({ ustadzId: val || 'all' })}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Semua Ustadz">
                  {(val: string | null) => optionLabel(teacherOptions, val, 'Semua Ustadz')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {teacherOptions.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Filter Santri (Khusus saat di tab Mutaba'ah Santri) */}
        {params.tab === 'mutabaah-santri' && studentOptions.length > 0 && (
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Pilih Santri</label>
            <Select
              value={params.studentId || (studentOptions[0]?.value ?? '')}
              onValueChange={(val) => onParamChange({ studentId: val || '' })}
            >
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Pilih Santri">
                  {(val: string | null) => optionLabel(studentOptions, val, 'Pilih Santri')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {studentOptions.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

