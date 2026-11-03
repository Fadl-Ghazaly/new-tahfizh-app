'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { computeLinesForRange, getSurahOptionsForJuz } from '@/lib/quran-juz';
import { hitungNilai } from '@/lib/tahfizh';
import { canChangeAttendance } from '@/lib/setoran/rules';
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
}

export function SetoranDialog({
  open,
  onOpenChange,
  student,
  selectedDate,
  type,
  role,
}: SetoranDialogProps) {
  const [attendance, setAttendance] = useState<string>(student?.attendanceStatus || '');
  const [juz, setJuz] = useState<number>(1);
  const [surahId, setSurahId] = useState<number>(1);
  const [ayahStart, setAyahStart] = useState<number>(1);
  const [ayahEnd, setAyahEnd] = useState<number>(7);
  const [manualOverride, setManualOverride] = useState<boolean>(false);
  const [lineCount, setLineCount] = useState<number>(5);
  const [mistakeCount, setMistakeCount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, setIsPending] = useState<boolean>(false);

  if (!student) return null;

  const isPresent = attendance === 'HADIR' || attendance === 'TERLAMBAT';
  const attendanceBlocked = !canChangeAttendance(attendance, student.activeRecordsCount);

  const surahOptions = getSurahOptionsForJuz(juz);

  const handleJuzChange = (newJuz: string | null) => {
    if (!newJuz) return;
    const j = parseInt(newJuz, 10);
    setJuz(j);
    const opts = getSurahOptionsForJuz(j);
    if (opts.length > 0) {
      setSurahId(opts[0].surahId);
      setAyahStart(opts[0].ayahStart);
      setAyahEnd(Math.min(opts[0].ayahStart + 5, opts[0].ayahEnd));
    }
  };

  const handleSurahChange = (newSurah: string | null) => {
    if (!newSurah) return;
    const sId = parseInt(newSurah, 10);
    setSurahId(sId);
    const opt = surahOptions.find((o) => o.surahId === sId);
    if (opt) {
      setAyahStart(opt.ayahStart);
      setAyahEnd(opt.ayahStart);
    }
  };

  const handleAttendanceChange = (val: string | null) => {
    if (val) {
      setAttendance(val);
      setFieldErrors({});
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
      const computed = isPresent ? computeLinesForRange(juz, surahId, ayahStart, ayahEnd) : null;
      const finalLines = manualOverride ? lineCount : computed;

      const payload = {
        attendance,
        type: isPresent ? type : null,
        juz: isPresent ? juz : null,
        surah_id: isPresent ? surahId : null,
        ayah_start: isPresent ? ayahStart : null,
        ayah_end: isPresent ? ayahEnd : null,
        line_count: finalLines,
        mistake_count: mistakeCount,
        notes: notes || null,
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
          <div className="flex items-center justify-between">
            <DialogTitle>Input Setoran Santri</DialogTitle>
            <Badge variant="outline">{type}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">{student.name} &mdash; {selectedDate}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className="text-sm font-medium">Status Kehadiran</label>
            <Select value={attendance} onValueChange={handleAttendanceChange}>
              <SelectTrigger aria-invalid={!!fieldErrors.attendance}>
                <SelectValue placeholder="Pilih Kehadiran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HADIR">Hadir</SelectItem>
                <SelectItem value="TERLAMBAT">Terlambat</SelectItem>
                <SelectItem value="IZIN">Izin</SelectItem>
                <SelectItem value="SAKIT">Sakit</SelectItem>
                <SelectItem value="ALPHA">Alpha</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.attendance && <p className="text-xs text-destructive mt-1">{fieldErrors.attendance}</p>}
            {attendanceBlocked && (
              <p className="text-xs text-destructive mt-1">
                Tidak dapat mengubah ke status ini karena santri masih memiliki setoran aktif pada hari ini.
              </p>
            )}
          </div>

          {!isPresent && attendance && (
            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground">
              Hanya kehadiran yang dicatat untuk status {attendance}.
            </div>
          )}

          {isPresent && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Juz</label>
                  <Select value={String(juz)} onValueChange={handleJuzChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Juz" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
                        <SelectItem key={j} value={String(j)}>Juz {j}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Surat</label>
                  <Select value={String(surahId)} onValueChange={handleSurahChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Surat" />
                    </SelectTrigger>
                    <SelectContent>
                      {surahOptions.map((opt) => (
                        <SelectItem key={opt.surahId} value={String(opt.surahId)}>Surat {opt.surahId}</SelectItem>
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
                    value={ayahStart}
                    onChange={(e) => setAyahStart(parseInt(e.target.value, 10) || 1)}
                  />
                  {fieldErrors.ayah_start && <p className="text-xs text-destructive mt-1">{fieldErrors.ayah_start}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium">Ayat Selesai</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={ayahEnd}
                    onChange={(e) => setAyahEnd(parseInt(e.target.value, 10) || 1)}
                  />
                  {fieldErrors.ayah_end && <p className="text-xs text-destructive mt-1">{fieldErrors.ayah_end}</p>}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Jumlah Baris</label>
                {!manualOverride ? (
                  <div className="text-sm font-semibold p-2 bg-muted rounded border">
                    {computeLinesForRange(juz, surahId, ayahStart, ayahEnd)} baris (otomatis)
                  </div>
                ) : (
                  <Input
                    type="number"
                    value={lineCount}
                    onChange={(e) => setLineCount(parseInt(e.target.value, 10) || 1)}
                  />
                )}
                {role === 'ADMIN' && (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="manualOverride"
                      checked={manualOverride}
                      onChange={(e) => setManualOverride(e.target.checked)}
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
                  <span>Kesalahan: <strong>{mistakeCount}</strong></span>
                  <span>Nilai Kelancaran: <strong>{hitungNilai(mistakeCount)}</strong></span>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setMistakeCount((m) => Math.min(50, m + 1))}>
                    +1 Kesalahan (-5 Nilai)
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setMistakeCount(0)}>
                    Atur Ulang
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Catatan</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
            <Button type="submit" disabled={isPending || attendanceBlocked || !attendance}>
              {isPending ? 'Menyimpan...' : 'Simpan Setoran'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
