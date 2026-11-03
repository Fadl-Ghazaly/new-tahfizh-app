'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
import { voidSetoran } from './actions';
import { toast } from 'sonner';

export interface MemorizationRecordRow {
  id: string;
  type: string;
  juz: number;
  surah_id: number;
  ayah_start: number;
  ayah_end: number;
  line_count: number;
  mistake_count: number;
  fluency_score: number;
  notes: string | null;
}

export interface RiwayatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: string;
    name: string;
    records: MemorizationRecordRow[];
  } | null;
  selectedDate: string;
}

export function RiwayatDialog({
  open,
  onOpenChange,
  student,
  selectedDate,
}: RiwayatDialogProps) {
  const [voidDialogOpen, setVoidDialogOpen] = useState<boolean>(false);
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>('');
  const [isPending, setIsPending] = useState<boolean>(false);

  if (!student) return null;

  const handleOpenVoid = (recordId: string) => {
    setSelectedRecordId(recordId);
    setReason('');
    setVoidDialogOpen(true);
  };

  const handleConfirmVoid = async () => {
    if (!selectedRecordId) return;
    if (reason.trim().length < 3) {
      toast.error('Alasan pembatalan minimal 3 karakter.');
      return;
    }

    setIsPending(true);
    try {
      const res = await voidSetoran(selectedRecordId, reason);
      if (!res.ok) {
        toast.error(res.error || 'Gagal membatalkan setoran.');
      } else {
        toast.success('Setoran berhasil dibatalkan (VOID).');
        setVoidDialogOpen(false);
        onOpenChange(false);
      }
    } catch {
      toast.error('Gagal memproses pembatalan.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Riwayat Setoran Hari Ini</DialogTitle>
            <p className="text-sm text-muted-foreground">{student.name} &mdash; {selectedDate}</p>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {student.records.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada setoran hafalan aktif pada tanggal ini.</p>
            ) : (
              student.records.map((r) => (
                <div key={r.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{r.type}</Badge>
                      <span className="text-sm font-medium">Juz {r.juz}, Surat {r.surah_id}:{r.ayah_start}-{r.ayah_end}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.line_count} baris &bull; Nilai {r.fluency_score} ({r.mistake_count} salah)
                    </div>
                    {r.notes && <p className="text-xs italic text-muted-foreground">&ldquo;{r.notes}&rdquo;</p>}
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => handleOpenVoid(r.id)}>
                    Batalkan
                  </Button>
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Setoran Hafalan</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan membatalkan status hafalan menjadi VOID. Masukkan alasan pembatalan (3-200 karakter).
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <Textarea
              placeholder="Alasan pembatalan (misal: Salah input ayat / koreksi)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
            />
          </div>

          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setVoidDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" disabled={isPending || reason.trim().length < 3} onClick={handleConfirmVoid}>
              {isPending ? 'Membatalkan...' : 'Konfirmasi Batalkan'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
