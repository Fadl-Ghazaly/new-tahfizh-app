'use client';

import { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import {
  LaporanFilterParams,
  ClassFilterOption,
  TeacherFilterOption,
  StudentFilterOption,
  MonthlyStudentSummaryRow,
  StudentMutabaahCardData,
  HalaqahPerformanceRow,
  LaporanTab,
} from '@/lib/laporan/types';
import { FilterBar } from './components/filter-bar';
import { ExportButtons } from './components/export-buttons';
import { RekapBulananTable } from './components/rekap-bulanan-table';
import { MutabaahSantriCard } from './components/mutabaah-santri-card';
import { KinerjaHalaqahTable } from './components/kinerja-halaqah-table';
import { generateRekapBulananCsv, generateMutabaahRecordsCsv } from '@/lib/laporan/csv';
import { getMonthName } from '@/lib/laporan/queries';

export interface LaporanClientProps {
  role: 'ADMIN' | 'USTADZ';
  params: LaporanFilterParams;
  classes: ClassFilterOption[];
  teachers: TeacherFilterOption[];
  students: StudentFilterOption[];
  monthlySummaries: MonthlyStudentSummaryRow[];
  studentCardData: StudentMutabaahCardData | null;
  halaqahPerformanceRows: HalaqahPerformanceRow[];
  schoolName?: string;
  logoUrl?: string | null;
}

export function LaporanClient({
  role,
  params,
  classes,
  teachers,
  students,
  monthlySummaries,
  studentCardData,
  halaqahPerformanceRows,
  schoolName = 'Pesantren Darul Ilmi',
  logoUrl = null,
}: LaporanClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const updateQuery = (newParams: Partial<Record<string, string | number>>) => {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(newParams)) {
      if (val !== undefined && val !== null && val !== 'all' && val !== '') {
        sp.set(key, String(val));
      } else {
        sp.delete(key);
      }
    }
    startTransition(() => {
      router.push(`${pathname}?${sp.toString()}`);
    });
  };

  const monthName = getMonthName(params.month);
  const periodLabel = `${monthName} ${params.year}`;
  const classLabel = params.classLevel === 'all'
    ? 'Semua Kelas'
    : `Kelas ${params.classLevel}`;
  const matchedTeacher = teachers.find((t) => t.id === params.ustadzId);
  const ustadzLabel = params.ustadzId === 'all'
    ? 'Semua Ustadz'
    : matchedTeacher?.name || 'Ustadz Pembina';

  const getCsvData = () => {
    if (params.tab === 'mutabaah-santri' && studentCardData) {
      return {
        content: generateMutabaahRecordsCsv(
          studentCardData.student.name,
          studentCardData.student.nisn,
          studentCardData.records,
          monthName,
          params.year
        ),
        filename: `Mutabaah_${studentCardData.student.name.replace(/\s+/g, '_')}_${monthName}_${params.year}.csv`,
      };
    }

    return {
      content: generateRekapBulananCsv(monthlySummaries, monthName, params.year),
      filename: `Rekap_Tahfizh_${monthName}_${params.year}.csv`,
    };
  };

  const tabs: Array<{ id: LaporanTab; label: string }> = [
    { id: 'rekap-bulanan', label: 'Rekapitulasi Bulanan' },
    { id: 'mutabaah-santri', label: 'Kartu Mutaba\'ah Santri' },
    { id: 'kinerja-halaqah', label: 'Kinerja Halaqah' },
  ];

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-lg font-bold text-foreground">
            Laporan Periode {monthName} {params.year}
          </h2>
          <p className="text-xs text-muted-foreground">
            Analisis capaian, kartu mutaba&apos;ah, dan rekapitulasi setoran tahfizh santri
          </p>
        </div>
        <ExportButtons
          getCsvData={getCsvData}
          disabled={monthlySummaries.length === 0}
        />
      </div>

      {/* Filter Bar */}
      <FilterBar
        role={role}
        params={params}
        classes={classes}
        teachers={teachers}
        students={students}
        onParamChange={(updates) => updateQuery(updates)}
      />

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-3 print:hidden">
        {tabs.map((t) => {
          const active = params.tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => updateQuery({ tab: t.id })}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab View */}
      {params.tab === 'rekap-bulanan' && (
        <RekapBulananTable
          rows={monthlySummaries}
          onSelectStudent={(studentId) => updateQuery({ tab: 'mutabaah-santri', studentId })}
          periodLabel={periodLabel}
          classLabel={classLabel}
          ustadzLabel={ustadzLabel}
          schoolName={schoolName}
          logoUrl={logoUrl}
        />
      )}

      {params.tab === 'mutabaah-santri' && (
        <>
          {studentCardData ? (
            <MutabaahSantriCard
              cardData={studentCardData}
              schoolName={schoolName}
              logoUrl={logoUrl}
            />
          ) : (
            <div className="rounded-xl border bg-card p-12 text-center text-muted-foreground shadow-sm">
              Tidak ada data santri yang ditemukan pada filter ini untuk menampilkan Kartu Mutaba&apos;ah.
            </div>
          )}
        </>
      )}

      {params.tab === 'kinerja-halaqah' && (
        <KinerjaHalaqahTable
          rows={halaqahPerformanceRows}
          periodLabel={periodLabel}
          schoolName={schoolName}
          logoUrl={logoUrl}
        />
      )}
    </div>
  );
}

