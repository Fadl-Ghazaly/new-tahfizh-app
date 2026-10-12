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
import { createStudent, updateStudent, setStudentStatus } from './actions';

interface ClassItem {
  id: string;
  name: string;
  level: number;
}

interface HalaqahItem {
  id: string;
  name: string;
  class_id: string;
  is_active: boolean;
  teachers?: { name: string } | null;
}

interface StudentItem {
  id: string;
  nisn: string;
  name: string;
  gender: string;
  class_id: string;
  halaqah_id: string;
  parent_name: string;
  parent_whatsapp: string;
  status: string;
  classes?: { name: string } | null;
  halaqahs?: { name: string; teachers?: { name: string } | null } | null;
}

export function SantriClientContent({
  initialParams,
  initialData,
}: {
  initialParams: { [key: string]: string | string[] | undefined };
  initialData: { classes: ClassItem[]; halaqahs: HalaqahItem[]; isAdmin: boolean };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [statusDialog, setStatusDialog] = useState<{ open: boolean; student: StudentItem | null; targetStatus: 'ACTIVE' | 'INACTIVE' }>({
    open: false,
    student: null,
    targetStatus: 'INACTIVE',
  });

  const [formNisn, setFormNisn] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState('L');
  const [formClassId, setFormClassId] = useState('');
  const [formHalaqahId, setFormHalaqahId] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentWhatsapp, setFormParentWhatsapp] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [formError, setFormError] = useState('');

  const search = searchParams.get('search') || '';
  const classFilter = searchParams.get('class') || 'all';
  const showInactive = searchParams.get('inactive') === 'true';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 20;

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (classFilter && classFilter !== 'all') params.set('class', classFilter);
        if (showInactive) params.set('inactive', 'true');
        params.set('page', page.toString());
        params.set('limit', pageSize.toString());

        const res = await fetch(`/api/santri-list?${params.toString()}`);
        const json = await res.json();
        setStudents(json.students || []);
        setTotalCount(json.count || 0);
      } catch {
        toast.error('Gagal memuat data santri.');
      } finally {
        setLoading(false);
      }
    }
    fetchStudents();
  }, [search, classFilter, showInactive, page]);

  function updateQuery(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');
    router.push(`/santri?${params.toString()}`);
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    updateQuery('search', query);
  }

  function openAddModal() {
    setEditingStudent(null);
    setFormNisn('');
    setFormName('');
    setFormGender('L');
    setFormClassId(initialData.classes[0]?.id || '');
    setFormHalaqahId('');
    setFormParentName('');
    setFormParentWhatsapp('');
    setFormStatus('ACTIVE');
    setFormError('');
    setIsFormOpen(true);
  }

  function openEditModal(s: StudentItem) {
    setEditingStudent(s);
    setFormNisn(s.nisn);
    setFormName(s.name);
    setFormGender(s.gender);
    setFormClassId(s.class_id);
    setFormHalaqahId(s.halaqah_id);
    setFormParentName(s.parent_name);
    setFormParentWhatsapp(s.parent_whatsapp);
    setFormStatus(s.status);
    setFormError('');
    setIsFormOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    const payload = {
      nisn: formNisn,
      name: formName,
      gender: formGender,
      class_id: formClassId,
      halaqah_id: formHalaqahId,
      parent_name: formParentName,
      parent_whatsapp: formParentWhatsapp,
      status: formStatus,
    };

    startTransition(async () => {
      let res;
      if (editingStudent) {
        res = await updateStudent(editingStudent.id, payload);
      } else {
        res = await createStudent(payload);
      }

      if (res.ok) {
        toast.success(editingStudent ? 'Santri berhasil diperbarui.' : 'Santri berhasil ditambahkan.');
        setIsFormOpen(false);
        router.refresh();
        window.location.reload();
      } else {
        setFormError(res.error || 'Terjadi kesalahan.');
        toast.error(res.error || 'Terjadi kesalahan.');
      }
    });
  }

  async function handleConfirmStatus() {
    if (!statusDialog.student) return;
    const s = statusDialog.student;
    const newStatus = statusDialog.targetStatus;

    startTransition(async () => {
      const res = await setStudentStatus(s.id, newStatus);
      if (res.ok) {
        toast.success(`Status santri berhasil diubah.`);
        setStatusDialog({ open: false, student: null, targetStatus: 'INACTIVE' });
        window.location.reload();
      } else {
        toast.error(res.error || 'Gagal mengubah status.');
      }
    });
  }

  const filteredHalaqahs = initialData.halaqahs.filter((h) => h.class_id === formClassId);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input name="search" defaultValue={search} placeholder="Cari nama atau NISN..." className="pl-8 w-full" />
          </div>
          <Button type="submit" variant="secondary" size="sm">Cari</Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <Select value={classFilter} onValueChange={(v) => v && updateQuery('class', v)}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Semua Kelas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {initialData.classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={showInactive} onChange={(e) => updateQuery('inactive', e.target.checked ? 'true' : 'false')} className="h-4 w-4" />
            Tampilkan Nonaktif
          </label>

          {initialData.isAdmin && <Button onClick={openAddModal} className="gap-2"><Plus className="h-4 w-4" /> Tambah Santri</Button>}
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead><TableHead>Nama</TableHead><TableHead>JK</TableHead><TableHead>Kelas</TableHead><TableHead>Halaqah</TableHead><TableHead>NISN</TableHead><TableHead>Ustadz</TableHead><TableHead>Orangtua</TableHead><TableHead>WA</TableHead><TableHead>Status</TableHead>
                {initialData.isAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s, idx) => (
                <TableRow key={s.id}>
                  <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                  <TableCell className="font-semibold">{s.name}</TableCell>
                  <TableCell><Badge variant={s.gender === 'L' ? 'default' : 'secondary'}>{s.gender}</Badge></TableCell>
                  <TableCell>{s.classes?.name || '-'}</TableCell>
                  <TableCell>{s.halaqahs?.name || '-'}</TableCell>
                  <TableCell className="font-mono text-xs">{s.nisn}</TableCell>
                  <TableCell>{s.halaqahs?.teachers?.name || '-'}</TableCell>
                  <TableCell>{s.parent_name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.parent_whatsapp}</TableCell>
                  <TableCell><Badge variant={s.status === 'ACTIVE' ? 'outline' : 'destructive'}>{s.status}</Badge></TableCell>
                  {initialData.isAdmin && (
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(s)}><Pencil className="h-4 w-4"/></Button>
                      {s.status === 'ACTIVE' 
                        ? <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setStatusDialog({open: true, student: s, targetStatus: 'INACTIVE'})}><UserX className="h-4 w-4"/></Button>
                        : <Button variant="ghost" size="icon" className="text-green-600" onClick={() => setStatusDialog({open: true, student: s, targetStatus: 'ACTIVE'})}><UserCheck className="h-4 w-4"/></Button>
                      }
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>{editingStudent ? 'Edit' : 'Tambah'} Santri</DialogTitle></DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
                <Input value={formNisn} onChange={e => setFormNisn(e.target.value)} placeholder="NISN" required maxLength={10}/>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="Nama" required/>
                <Select value={formGender} onValueChange={(v) => v && setFormGender(v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="L">L</SelectItem><SelectItem value="P">P</SelectItem></SelectContent></Select>
                <Select value={formClassId} onValueChange={(v) => v && setFormClassId(v)}><SelectTrigger><SelectValue placeholder="Kelas"/></SelectTrigger><SelectContent>{initialData.classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                <Select value={formHalaqahId} onValueChange={(v) => v && setFormHalaqahId(v)}><SelectTrigger><SelectValue placeholder="Halaqah"/></SelectTrigger><SelectContent>{filteredHalaqahs.map(h => <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>)}</SelectContent></Select>
                <Input value={formParentName} onChange={e => setFormParentName(e.target.value)} placeholder="Orangtua" required/>
                <Input value={formParentWhatsapp} onChange={e => setFormParentWhatsapp(e.target.value)} placeholder="WA" required/>
                <Button type="submit" disabled={isPending}>Simpan</Button>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
