'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { computeLinesForRange, getSurahOptionsForJuz } from '@/lib/quran-juz';
import { hitungNilai } from '@/lib/tahfizh';
import { optionLabel, SelectOption } from '@/lib/formatters';
import { canChangeAttendance } from '@/lib/setoran/rules';
import {
  DialogFormState,
  getInitialDialogState,
  handleJuzChangeState,
  isAyahRangeValid,
  formatSetoranDateIndonesian,
} from '@/lib/setoran/dialog-state';
import { SetoranSurahOption } from './setoran-client';
import { submitSetoran } from './actions';
import { toast } from 'sonner';

export interface SetoranDialogStudent {
  id: string;
  name: string;
  attendanceStatus: string | null;
  activeRecordsCount: number;
}

export interface SetoranDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: SetoranDialogStudent | null;
  selectedDate: string;
  type: 'SABAQ' | 'SABQI' | 'MANZIL';
  role: 'ADMIN' | 'USTADZ';
  surahs: SetoranSurahOption[];
}

export function SetoranDialog({
  open,
  onOpenChange,
  student,
  selectedDate,
  type,
  role,
  surahs,
}: SetoranDialogProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [formState, setFormState] = useState<DialogFormState>(() =>
    getInitialDialogState(student?.attendanceStatus)
  );

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, setIsPending] = useState<boolean>(false);

  if (!student) return null;

  const isPresent = formState.attendance === 'HADIR' || formState.attendance === 'TERLAMBAT';
  const attendanceBlocked = !canChangeAttendance(formState.attendance, student.activeRecordsCount);

  const attendanceOptions: SelectOption[] = [
    { value: 'HADIR', label: 'Hadir' },
    { value: 'TERLAMBAT', label: 'Terlambat' },
    { value: 'IZIN', label: 'Izin' },
    { value: 'SAKIT', label: 'Sakit' },
    { value: 'ALPHA', label: 'Alpha' },
  ];

  const juzOptions: SelectOption[] = Array.from({ length: 30 }, (_, i) => ({
    value: String(i + 1),
    label: `Juz ${i + 1}`,
  }));

  const jNum = formState.juz ? parseInt(formState.juz, 10) : null;
  const surahOptions = jNum ? getSurahOptionsForJuz(jNum) : [];

  const surahSelectOptions: SelectOption[] = surahOptions.map((opt) => {
    const meta = surahs.find((s) => s.id === opt.surahId);
    const label = meta ? `${meta.number}. ${meta.nameLatin}` : `Surat ${opt.surahId}`;
    return {
      value: String(opt.surahId),
      label,
    };
  });

  const sNum = formState.surahId ? parseInt(formState.surahId, 10) : null;
  const aStartNum = formState.ayahStart ? parseInt(formState.ayahStart, 10) : null;
  const aEndNum = formState.ayahEnd ? parseInt(formState.ayahEnd, 10) : null;

  const rangeValid = isAyahRangeValid(jNum, sNum, aStartNum, aEndNum);
  const computedLines = rangeValid && jNum && sNum && aStartNum && aEndNum
    ? computeLinesForRange(jNum, sNum, aStartNum, aEndNum)
    : null;

  const handleJuzChange = (newJuz: string | null) => {
    if (!newJuz) return;
    setFormState((prev) => handleJuzChangeState(prev, newJuz));
    setFieldErrors({});
  };

  const handleSurahChange = (newSurah: string | null) => {
    if (!newSurah) return;
    const sId = parseInt(newSurah, 10);
    const opt = surahOptions.find((o) => o.surahId === sId);
    setFormState((prev) => ({
      ...prev,
      surahId: newSurah,
      ayahStart: opt ? String(opt.ayahStart) : '',
      ayahEnd: opt ? String(opt.ayahStart) : '',
      lineCount: '',
    }));
    setFieldErrors({});
  };

  const handleAttendanceChange = (val: string | null) => {
    if (val) {
      setFormState((prev) => ({ ...prev, attendance: val }));
      setFieldErrors({});
    }
  };

  const getTypeBadgeClass = (t: 'SABAQ' | 'SABQI' | 'MANZIL') => {
    switch (t) {
      case 'SABAQ':
        return 'border-emerald-500 text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30';
      case 'SABQI':
        return 'border-blue-500 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/30';
      case 'MANZIL':
        return 'border-amber-500 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    if (attendanceBlocked) {
      return;
    }

    setIsPending(true);

    try {
      const finalLines = formState.manualOverride
        ? (parseInt(formState.lineCount, 10) || null)
        : computedLines;

      const payload = {
        attendance: formState.attendance,
        type: isPresent ? type : null,
        juz: isPresent && jNum ? jNum : null,
        surah_id: isPresent && sNum ? sNum : null,
        ayah_start: isPresent && aStartNum ? aStartNum : null,
        ayah_end: isPresent && aEndNum ? aEndNum : null,
        line_count: finalLines,
        mistake_count: formState.mistakeCount,
        notes: formState.notes || null,
      };

      const res = await submitSetoran({
        studentId: student.id,
        date: selectedDate,
        formData: payload,
      });

      if (!res.ok) {
        if (res.fieldErrors) {
          setFieldErrors(res.fieldErrors);
        }
        if (res.error) {
          toast.error(res.error);
        }
      } else {
        toast.success('Setoran berhasil disimpan');
        onOpenChange(false);
        startTransition(() => {
          router.refresh();
        });
      }
    } catch {
      toast.error('Gagal memproses setoran.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Input Setoran Santri</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <span>{student.name} &mdash; {formatSetoranDateIndonesian(selectedDate)}</span>
            <Badge variant="outline" className={getTypeBadgeClass(type)}>
              {type}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="text-sm font-medium">Status Kehadiran</label>
            <Select value={formState.attendance} onValueChange={handleAttendanceChange}>
              <SelectTrigger aria-invalid={!!fieldErrors.attendance}>
                <SelectValue placeholder="Pilih Kehadiran">
                  {(val: string | null) => optionLabel(attendanceOptions, val, 'Pilih Kehadiran')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {attendanceOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.attendance && <p className="text-xs text-destructive mt-1">{fieldErrors.attendance}</p>}
            {attendanceBlocked && (
              <p className="text-xs text-destructive mt-1">
                Tidak dapat mengubah ke status ini karena santri masih memiliki setoran aktif pada hari ini.
              </p>
            )}
          </div>

          {!isPresent && formState.attendance && (
            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
              Hanya kehadiran yang dicatat untuk status {formState.attendance}.
            </div>
          )}

          {isPresent && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Juz</label>
                  <Select value={formState.juz} onValueChange={handleJuzChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih juz">
                        {(val: string | null) => optionLabel(juzOptions, val, 'Pilih juz')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {juzOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Surat</label>
                  <Select
                    value={formState.surahId}
                    onValueChange={handleSurahChange}
                    disabled={!formState.juz}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih surat">
                        {(val: string | null) => optionLabel(surahSelectOptions, val, 'Pilih surat')}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {surahSelectOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Ayat Mulai</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Ayat mulai"
                    value={formState.ayahStart}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, ayahStart: e.target.value }))
                    }
                  />
                  {fieldErrors.ayah_start && <p className="text-xs text-destructive mt-1">{fieldErrors.ayah_start}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Ayat Selesai</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="Ayat selesai"
                    value={formState.ayahEnd}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, ayahEnd: e.target.value }))
                    }
                  />
                  {fieldErrors.ayah_end && <p className="text-xs text-destructive mt-1">{fieldErrors.ayah_end}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Jumlah Baris</label>
                {!formState.manualOverride ? (
                  <div className="text-sm p-2 bg-muted rounded border">
                    {rangeValid && computedLines !== null ? (
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                        {computedLines} baris (otomatis)
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Pilih juz, surat, dan rentang ayat yang valid
                      </span>
                    )}
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={formState.lineCount}
                    placeholder="Masukkan jumlah baris manual"
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, lineCount: e.target.value }))
                    }
                  />
                )}
                {role === 'ADMIN' && (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="manualOverride"
                      checked={formState.manualOverride}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          manualOverride: e.target.checked,
                          lineCount: prev.lineCount || (computedLines ? String(computedLines) : ''),
                        }))
                      }
                      className="rounded"
                    />
                    <label htmlFor="manualOverride" className="text-xs text-muted-foreground">
                      Ubah jumlah baris manual (wajib catatan &ge; 5 karakter)
                    </label>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Kesalahan: <strong>{formState.mistakeCount}</strong></span>
                  <span>Nilai Kelancaran: <strong>{hitungNilai(formState.mistakeCount)}</strong></span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        mistakeCount: Math.min(50, prev.mistakeCount + 1),
                      }))
                    }
                  >
                    +1 Kesalahan (-5 Nilai)
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setFormState((prev) => ({ ...prev, mistakeCount: 0 }))
                    }
                  >
                    Atur Ulang
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Catatan</label>
                <Textarea
                  value={formState.notes}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  placeholder="Catatan ustadz / admin..."
                  maxLength={500}
                />
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={
                isPending ||
                attendanceBlocked ||
                !formState.attendance ||
                (isPresent && (!rangeValid || (!formState.manualOverride && !computedLines)))
              }
            >
              {isPending ? 'Menyimpan...' : 'Simpan Setoran'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
