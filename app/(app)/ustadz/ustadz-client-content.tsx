'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Pencil, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { createTeacher, updateTeacher, setTeacherStatus } from './actions';

interface TeacherItem {
  id: string;
  name: string;
  gender: string;
  whatsapp: string;
  boarding_school: string;
  is_active: boolean;
  halaqahs?: { name: string; classes?: { name: string } | null }[];
}

export function UstadzClientContent({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; teacher: TeacherItem | null; targetActive: boolean }>({
    open: false,
    teacher: null,
    targetActive: false,
  });

  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState('L');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formBoarding, setFormBoarding] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formError, setFormError] = useState('');

  const search = searchParams.get('search') || '';
  const showInactive = searchParams.get('inactive') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 20;

  useEffect(() => {
    async function fetchTeachers() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (showInactive) params.set('inactive', 'true');
        params.set('page', page.toString());
        params.set('limit', pageSize.toString());

        const res = await fetch(`/api/ustadz-list?${params.toString()}`);
        const json = await res.json();
        setTeachers(json.teachers || []);
        setTotalCount(json.count || 0);
      } catch {
        toast.error('Gagal memuat data ustadz.');
      } finally {
        setLoading(false);
      }
    }
    fetchTeachers();
  }, [search, showInactive, page]);

  function openAddModal() {
    setEditingTeacher(null);
    setFormName('');
    setFormGender('L');
    setFormWhatsapp('');
    setFormBoarding('');
    setFormActive(true);
    setFormError('');
    setIsFormOpen(true);
  }

  function openEditModal(t: TeacherItem) {
    setEditingTeacher(t);
    setFormName(t.name);
    setFormGender(t.gender);
    setFormWhatsapp(t.whatsapp);
    setFormBoarding(t.boarding_school);
    setFormActive(t.is_active);
    setFormError('');
    setIsFormOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const payload = { name: formName, gender: formGender, whatsapp: formWhatsapp, boarding_school: formBoarding, is_active: formActive };

    startTransition(async () => {
      let res;
      if (editingTeacher) {
        res = await updateTeacher(editingTeacher.id, payload);
      } else {
        res = await createTeacher(payload);
      }

      if (res.ok) {
        toast.success(editingTeacher ? 'Ustadz berhasil diperbarui.' : 'Ustadz berhasil ditambahkan.');
        setIsFormOpen(false);
        window.location.reload();
      } else {
        setFormError(res.error || 'Terjadi kesalahan.');
        toast.error(res.error || 'Terjadi kesalahan.');
      }
    });
  }

  async function handleConfirmStatus() {
    if (!statusDialog.teacher) return;
    startTransition(async () => {
      const res = await setTeacherStatus(statusDialog.teacher!.id, statusDialog.targetActive);
      if (res.ok) {
        toast.success(`Status ustadz berhasil diubah.`);
        setStatusDialog({ open: false, teacher: null, targetActive: false });
        window.location.reload();
      } else {
        toast.error(res.error || 'Gagal mengubah status.');
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <form onSubmit={(e) => { e.preventDefault(); router.push(`/ustadz?search=${new FormData(e.currentTarget).get('search')}`); }} className="flex gap-2">
            <Input name="search" defaultValue={search} placeholder="Cari nama..." className="w-64" />
            <Button type="submit" variant="secondary">Cari</Button>
        </form>
        {isAdmin && <Button onClick={openAddModal}><Plus className="h-4 w-4 mr-2"/> Tambah Ustadz</Button>}
      </div>

      <div className="rounded-md border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Nama</TableCell>
              <TableCell>JK</TableCell>
              <TableCell>WA</TableCell>
              <TableCell>Asal Pondok</TableCell>
              <TableCell>Halaqah</TableCell>
              <TableCell>Status</TableCell>
              {isAdmin && <TableCell className="text-right">Aksi</TableCell>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.map((t, idx) => (
              <TableRow key={t.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell className="font-semibold">{t.name}</TableCell>
                <TableCell><Badge variant={t.gender === 'L' ? 'default' : 'secondary'}>{t.gender}</Badge></TableCell>
                <TableCell className="font-mono text-xs">{t.whatsapp}</TableCell>
                <TableCell>{t.boarding_school}</TableCell>
                <TableCell>{t.halaqahs?.map(h => h.name).join(', ') || '-'}</TableCell>
                <TableCell><Badge variant={t.is_active ? 'outline' : 'destructive'}>{t.is_active ? 'Aktif' : 'Nonaktif'}</Badge></TableCell>
                {isAdmin && (
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditModal(t)}><Pencil className="h-4 w-4"/></Button>
                    <Button variant="ghost" size="icon" className={t.is_active ? 'text-destructive' : 'text-green-600'} 
                      onClick={() => setStatusDialog({ open: true, teacher: t, targetActive: !t.is_active })}>
                      {t.is_active ? <UserX className="h-4 w-4"/> : <UserCheck className="h-4 w-4"/>}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{editingTeacher ? 'Edit Ustadz' : 'Tambah Ustadz'}</DialogTitle></DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                {formError && <div className="text-destructive text-sm">{formError}</div>}
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nama Lengkap" required/>
                <Select value={formGender} onValueChange={(v) => v && setFormGender(v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="L">L</SelectItem><SelectItem value="P">P</SelectItem></SelectContent></Select>
                <Input value={formWhatsapp} onChange={e => setFormWhatsapp(e.target.value)} placeholder="08..." required/>
                <Input value={formBoarding} onChange={e => setFormBoarding(e.target.value)} placeholder="Asal Pondok" required/>
                {editingTeacher && (
                    <label className="flex items-center gap-2"><input type="checkbox" checked={formActive} onChange={e => setFormActive(e.target.checked)}/> Aktif</label>
                )}
                <DialogFooter><Button type="submit" disabled={isPending}>Simpan</Button></DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
