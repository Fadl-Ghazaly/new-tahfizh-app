'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCapaian } from '@/lib/tahfizh';
import { optionLabel, withUstadzTitle } from '@/lib/formatters';
import { SetoranDialog, SetoranDialogStudent } from './setoran-dialog';
import { RiwayatDialog, MemorizationRecordRow } from './riwayat-dialog';

export interface StudentSetoranItem {
  id: string;
  name: string;
  className: string;
  halaqahName: string;
  rawTeacherName: string;
  attendanceStatus: string | null;
  selectedTypeRecordCount: number;
  selectedTypeTotalLines: number;
  allDailyRecords: MemorizationRecordRow[];
}

export interface SetoranClientClassOption {
  id: string;
  name: string;
  level: number;
}

export interface SetoranClientTeacherOption {
  id: string;
  name: string;
}

export interface SetoranSurahOption {
  id: number;
  number: number;
  nameLatin: string;
}

export interface SetoranClientProps {
  role: 'ADMIN' | 'USTADZ';
  params: {
    date: string;
    type: 'SABAQ' | 'SABQI' | 'MANZIL';
    classLevel: number | 'all';
    ustadzId: string | 'all';
    search: string;
    page: number;
  };
  dateLimits: { min: string; max: string };
  classes: SetoranClientClassOption[];
  teachers: SetoranClientTeacherOption[];
  surahs: SetoranSurahOption[];
  items: StudentSetoranItem[];
  totalCount: number;
}

export function SetoranClient({
  role,
  params,
  dateLimits,
  classes,
  teachers,
  surahs,
  items,
  totalCount,
}: SetoranClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [dateInput, setDateInput] = useState<string>(params.date);
  const [searchInput, setSearchInput] = useState<string>(params.search);

  const [inputStudent, setInputStudent] = useState<SetoranDialogStudent | null>(null);
  const [inputOpen, setInputOpen] = useState<boolean>(false);

  const [riwayatStudent, setRiwayatStudent] = useState<{ id: string; name: string; records: MemorizationRecordRow[] } | null>(null);
  const [riwayatOpen, setRiwayatOpen] = useState<boolean>(false);

  const classFilterOptions = [
    { value: 'all', label: 'Semua Kelas' },
    ...classes.map((c) => ({ value: String(c.level), label: `Kelas ${c.level}` })),
  ];

  const ustadzFilterOptions = [
    { value: 'all', label: 'Semua Ustadz' },
    ...teachers.map((t) => ({ value: t.id, label: withUstadzTitle(t.name) })),
  ];

  const getTabStyle = (tabType: 'SABAQ' | 'SABQI' | 'MANZIL', isActive: boolean) => {
    switch (tabType) {
      case 'SABAQ':
        return isActive
          ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-700'
          : 'border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40';
      case 'SABQI':
        return isActive
          ? 'bg-blue-600 text-white shadow-sm dark:bg-blue-700'
          : 'border border-blue-500/40 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40';
      case 'MANZIL':
        return isActive
          ? 'bg-amber-600 text-white shadow-sm dark:bg-amber-700'
          : 'border border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40';
    }
  };

  const updateQuery = (newParams: Record<string, string | number>) => {
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQuery({ q: searchInput, page: 1 });
  };

  const handleDateChange = (newDate: string) => {
    setDateInput(newDate);
    updateQuery({ date: newDate, page: 1 });
  };

  const totalPages = Math.ceil(totalCount / 20) || 1;

  const attendanceBadge = (status: string | null) => {
    switch (status) {
      case 'HADIR': return <Badge className="bg-emerald-600">Hadir</Badge>;
      case 'TERLAMBAT': return <Badge className="bg-amber-600">Terlambat</Badge>;
      case 'IZIN': return <Badge variant="secondary">Izin</Badge>;
      case 'SAKIT': return <Badge variant="secondary">Sakit</Badge>;
      case 'ALPHA': return <Badge variant="destructive">Alpha</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground">Belum Absen</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Tanggal</label>
            <Input
              type="date"
              value={dateInput}
              min={dateLimits.min}
              max={dateLimits.max}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Kelas</label>
            <Select
              value={String(params.classLevel)}
              onValueChange={(val) => updateQuery({ class: val || 'all', page: 1 })}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Semua Kelas">
                  {(val: string | null) => optionLabel(classFilterOptions, val, 'Semua Kelas')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kelas</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={String(c.level)}>Kelas {c.level} ({c.name})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {role === 'ADMIN' && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Ustadz</label>
              <Select
                value={params.ustadzId}
                onValueChange={(val) => updateQuery({ ustadz: val || 'all', page: 1 })}
              >
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Semua Ustadz">
                    {(val: string | null) => optionLabel(ustadzFilterOptions, val, 'Semua Ustadz')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Ustadz</SelectItem>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{withUstadzTitle(t.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <Input
            placeholder="Cari nama santri..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full md:w-60"
          />
          <Button type="submit" variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="flex gap-2 border-b pb-3">
        {(['SABAQ', 'SABQI', 'MANZIL'] as const).map((t) => {
          const active = params.type === t;
          const sp = new URLSearchParams(searchParams.toString());
          sp.set('type', t);
          sp.set('page', '1');
          return (
            <Link
              key={t}
              href={`${pathname}?${sp.toString()}`}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${getTabStyle(t, active)}`}
            >
              {t}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 font-medium">No</TableHead>
              <TableHead className="font-medium">Nama Santri</TableHead>
              <TableHead className="font-medium">Kelas</TableHead>
              <TableHead className="font-medium">Halaqah</TableHead>
              <TableHead className="font-medium">Kehadiran</TableHead>
              <TableHead className="font-medium">Capaian {params.type} Hari Ini</TableHead>
              <TableHead className="text-right font-medium">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Tidak ada santri yang ditemukan pada filter ini.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, idx) => {
                const no = (params.page - 1) * 20 + idx + 1;
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{no}</TableCell>
                    <TableCell>
                      <div className="font-semibold">{item.name}</div>
                    </TableCell>
                    <TableCell>{item.className}</TableCell>
                    <TableCell>
                      {item.halaqahName === '-' ? (
                        '-'
                      ) : (
                        <>
                          {item.halaqahName}{' '}
                          {item.rawTeacherName && item.rawTeacherName !== '-' && (
                            <span className="text-xs text-muted-foreground">({item.rawTeacherName})</span>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell>{attendanceBadge(item.attendanceStatus)}</TableCell>
                    <TableCell>
                      {item.selectedTypeRecordCount > 0 ? (
                        <div className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                          {item.selectedTypeRecordCount} setoran ({formatCapaian(item.selectedTypeTotalLines)})
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Belum ada</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setInputStudent({
                            id: item.id,
                            name: item.name,
                            attendanceStatus: item.attendanceStatus,
                            activeRecordsCount: item.allDailyRecords.length,
                          });
                          setInputOpen(true);
                        }}
                      >
                        Input
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setRiwayatStudent({
                            id: item.id,
                            name: item.name,
                            records: item.allDailyRecords,
                          });
                          setRiwayatOpen(true);
                        }}
                      >
                        Riwayat
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t bg-muted/20">
            <span className="text-sm text-muted-foreground">
              Halaman {params.page} dari {totalPages} (Total {totalCount} santri)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={params.page <= 1 || isPending}
                onClick={() => updateQuery({ page: params.page - 1 })}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={params.page >= totalPages || isPending}
                onClick={() => updateQuery({ page: params.page + 1 })}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <SetoranDialog
        key={inputStudent ? `${inputStudent.id}-${inputOpen}` : 'closed'}
        open={inputOpen}
        onOpenChange={setInputOpen}
        student={inputStudent}
        selectedDate={params.date}
        type={params.type}
        role={role}
        surahs={surahs}
      />

      <RiwayatDialog
        open={riwayatOpen}
        onOpenChange={setRiwayatOpen}
        student={riwayatStudent}
        selectedDate={params.date}
      />
    </div>
  );
}
