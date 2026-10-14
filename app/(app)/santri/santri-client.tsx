'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Pencil, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from 'cn';
import {
  optionLabel,
  getGenderOptions,
  getStatusOptions,
  resolveHalaqahOnClassChange,
} from '@/lib/formatters';
import { studentSchema } from '@/lib/validators/santri';
import { zodIssuesToFieldErrors } from '@/lib/validators/common';
import { createStudent, updateStudent, setStudentStatus } from './actions';

export interface ClassOption {
  id: string;
  name: string;
  level: number;
}

export interface HalaqahOption {
  id: string;
  name: string;
  class_id: string;
  teacher_name?: string | null;
}

export interface StudentRow {
  id: string;
  nisn: string;
  name: string;
  gender: string;
  class_id: string;
  halaqah_id: string;
  parent_name: string;
  parent_whatsapp: string;
  status: string;
  class_name: string;
  halaqah_name: string;
  teacher_name: string;
}

interface SantriClientProps {
  students: StudentRow[];
  totalCount: number;
  classes: ClassOption[];
  activeHalaqahs: HalaqahOption[];
  isAdmin: boolean;
  currentPage: number;
  pageSize: number;
  currentSearch: string;
  currentClass: string;
  currentInactive: boolean;
}

const FIELD_ORDER = ['nisn', 'name', 'gender', 'class_id', 'halaqah_id', 'parent_name', 'parent_whatsapp'];

export function SantriClient({
  students,
  totalCount,
  classes,
  activeHalaqahs,
  isAdmin,
  currentPage,
  pageSize,
  currentSearch,
  currentClass,
  currentInactive,
}: SantriClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Controlled Search Input State with sync on render
  const [searchInput, setSearchInput] = useState(currentSearch);
  const [prevSearch, setPrevSearch] = useState(currentSearch);

  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch);
    setSearchInput(currentSearch);
  }

  // Form Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);

  // Form Fields
  const [formNisn, setFormNisn] = useState('');
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formClassId, setFormClassId] = useState('');
  const [formHalaqahId, setFormHalaqahId] = useState('');
  const [formParentName, setFormParentName] = useState('');
  const [formParentWhatsapp, setFormParentWhatsapp] = useState('');
  const [formStatus, setFormStatus] = useState('ACTIVE');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  // Status Change Dialog
  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    student: StudentRow | null;
    targetStatus: 'ACTIVE' | 'INACTIVE';
  }>({
    open: false,
    student: null,
    targetStatus: 'INACTIVE',
  });

  // Select Option Mappings
  const genderOptions = useMemo(() => getGenderOptions(), []);
  const statusOptions = useMemo(() => getStatusOptions(), []);

  const classFilterOptions = useMemo(() => [
    { value: 'all', label: 'Semua Kelas' },
    ...classes.map((c) => ({ value: c.level.toString(), label: `Kelas ${c.level}` })),
  ], [classes]);

  const formClassOptions = useMemo(() => classes.map((c) => ({
    value: c.id,
    label: `Kelas ${c.level}`,
  })), [classes]);

  const formHalaqahOptions = useMemo(() => activeHalaqahs
    .filter((h) => h.class_id === formClassId)
    .map((h) => ({
      value: h.id,
      label: h.teacher_name ? `${h.name} (Ust. ${h.teacher_name})` : h.name,
    })), [activeHalaqahs, formClassId]);

  function createQueryString(paramsToUpdate: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(paramsToUpdate).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all' || value === 'false') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    return params.toString();
  }

  function handleFilterChange(key: string, value: string | null) {
    const queryString = createQueryString({ [key]: value, page: '1' });
    startTransition(() => {
      router.push(`${pathname}?${queryString}`);
    });
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = searchInput.trim();
    handleFilterChange('search', query);
  }

  function openAddModal() {
    setEditingStudent(null);
    setFormNisn('');
    setFormName('');
    setFormGender('');
    setFormClassId('');
    setFormHalaqahId('');
    setFormParentName('');
    setFormParentWhatsapp('');
    setFormStatus('ACTIVE');
    setFieldErrors({});
    setFormError('');
    setIsFormOpen(true);
  }

  function openEditModal(s: StudentRow) {
    setEditingStudent(s);
    setFormNisn(s.nisn);
    setFormName(s.name);
    setFormGender(s.gender);
    setFormClassId(s.class_id);
    setFormHalaqahId(s.halaqah_id);
    setFormParentName(s.parent_name);
    setFormParentWhatsapp(s.parent_whatsapp);
    setFormStatus(s.status);
    setFieldErrors({});
    setFormError('');
    setIsFormOpen(true);
  }

  function handleClassChange(newClassId: string) {
    setFormClassId(newClassId);
    setFormHalaqahId((prevHalaqahId) =>
      resolveHalaqahOnClassChange(newClassId, prevHalaqahId, activeHalaqahs)
    );
    setFieldErrors((prev) => {
      const copy = { ...prev };
      delete copy.class_id;
      delete copy.halaqah_id;
      return copy;
    });
  }

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const copy = { ...prev };
      delete copy[field];
      return copy;
    });
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

    const parsed = studentSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = zodIssuesToFieldErrors(parsed.error.issues);
      setFieldErrors(errs);

      // Focus first invalid field
      const firstInvalid = FIELD_ORDER.find((f) => errs[f]);
      if (firstInvalid) {
        const el = document.getElementById(firstInvalid);
        if (el) {
          el.focus();
        } else {
          // If it's a select trigger, find by id or aria
          const triggerEl = document.getElementById(firstInvalid);
          triggerEl?.focus();
        }
      }
      return;
    }

    startTransition(async () => {
      const res = editingStudent
        ? await updateStudent(editingStudent.id, payload)
        : await createStudent(payload);

      if (res.ok) {
        toast.success(editingStudent ? 'Data santri berhasil diperbarui.' : 'Santri berhasil ditambahkan.');
        setIsFormOpen(false);
      } else {
        const errorMsg = res.error || 'Terjadi kesalahan.';
        if (errorMsg.includes('NISN')) {
          setFieldErrors((prev) => ({ ...prev, nisn: errorMsg }));
          document.getElementById('nisn')?.focus();
        } else {
          setFormError(errorMsg);
        }
        toast.error(errorMsg);
      }
    });
  }

  async function handleConfirmStatus() {
    if (!statusDialog.student) return;
    const s = statusDialog.student;
    const targetStatus = statusDialog.targetStatus;

    startTransition(async () => {
      const res = await setStudentStatus(s.id, targetStatus);
      if (res.ok) {
        toast.success(`Status ${s.name} berhasil diubah menjadi ${targetStatus === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}.`);
        setStatusDialog({ open: false, student: null, targetStatus: 'INACTIVE' });
      } else {
        toast.error(res.error || 'Gagal mengubah status santri.');
      }
    });
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const prevQuery = createQueryString({ page: (currentPage - 1).toString() });
  const nextQuery = createQueryString({ page: (currentPage + 1).toString() });

  return (
    <div className="flex flex-col gap-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={50}
              placeholder="Cari nama atau NISN..."
              className="pl-8 w-full"
            />
          </div>
          <Button type="submit" variant="outline" size="sm" disabled={isPending}>
            Cari
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <Select
            value={currentClass}
            onValueChange={(val) => val && handleFilterChange('class', val)}
          >
            <SelectTrigger className="w-[140px] truncate">
              <SelectValue placeholder="Semua Kelas">
                {(val: string | null) => optionLabel(classFilterOptions, val, 'Semua Kelas')}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="bg-popover text-popover-foreground border-border z-50">
              {classFilterOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={currentInactive}
              onChange={(e) => handleFilterChange('inactive', e.target.checked ? 'true' : null)}
              className="rounded border-input text-primary focus:ring-primary h-4 w-4"
            />
            Tampilkan Nonaktif
          </label>

          {isAdmin && (
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Santri
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card shadow-sm overflow-hidden relative">
        {isPending && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="text-sm font-medium text-muted-foreground">Memuat data...</div>
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Santri</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Kelas Halaqah</TableHead>
                <TableHead>NISN</TableHead>
                <TableHead>Ustadz Pengampu</TableHead>
                <TableHead>Orangtua</TableHead>
                <TableHead>WA Orangtua</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 11 : 10}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Belum ada data atau tidak ada hasil untuk filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  const isInactive = s.status !== 'ACTIVE';
                  return (
                    <TableRow key={s.id} className={isInactive ? 'opacity-60 bg-muted/30' : ''}>
                      <TableCell className="font-medium">{rowNumber}</TableCell>
                      <TableCell className="font-semibold">{s.name}</TableCell>
                      <TableCell>
                        <Badge variant={s.gender === 'L' ? 'default' : 'secondary'}>
                          {s.gender}
                        </Badge>
                      </TableCell>
                      <TableCell>{s.class_name}</TableCell>
                      <TableCell>{s.halaqah_name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.nisn}</TableCell>
                      <TableCell>{s.teacher_name}</TableCell>
                      <TableCell>{s.parent_name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.parent_whatsapp}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'ACTIVE' ? 'outline' : 'destructive'}>
                          {s.status === 'ACTIVE' ? 'Aktif' : s.status === 'INACTIVE' ? 'Nonaktif' : 'Lulus'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Santri"
                            onClick={() => openEditModal(s)}
                            aria-label={`Edit ${s.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {s.status === 'ACTIVE' ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Nonaktifkan Santri"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setStatusDialog({ open: true, student: s, targetStatus: 'INACTIVE' })}
                              aria-label={`Nonaktifkan ${s.name}`}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Aktifkan Kembali"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => setStatusDialog({ open: true, student: s, targetStatus: 'ACTIVE' })}
                              aria-label={`Aktifkan ${s.name}`}
                            >
                              <UserCheck className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Server Link Pagination */}
        <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
          <div>
            Menampilkan {students.length} dari {totalCount} santri
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`${pathname}?${prevQuery}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                currentPage <= 1 && 'pointer-events-none opacity-50'
              )}
              aria-disabled={currentPage <= 1}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Sebelumnya
            </Link>

            <span>
              Hal. {currentPage} / {totalPages}
            </span>

            <Link
              href={`${pathname}?${nextQuery}`}
              className={cn(
                buttonVariants({ variant: 'outline', size: 'sm' }),
                currentPage >= totalPages && 'pointer-events-none opacity-50'
              )}
              aria-disabled={currentPage >= totalPages}
            >
              Berikutnya <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </div>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg bg-popover text-popover-foreground">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Data Santri' : 'Tambah Santri Baru'}</DialogTitle>
            <DialogDescription>
              Isi formulir data santri di bawah ini dengan lengkap.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} noValidate className="space-y-4">
            {formError && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium" role="alert" aria-live="polite">
                {formError}
              </div>
            )}
            {fieldErrors._form && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md font-medium" role="alert" aria-live="polite">
                {fieldErrors._form}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="nisn">NISN (10 digit)</Label>
                <Input
                  id="nisn"
                  value={formNisn}
                  onChange={(e) => {
                    setFormNisn(e.target.value);
                    clearFieldError('nisn');
                  }}
                  maxLength={10}
                  className="w-full bg-background border-input"
                  aria-invalid={!!fieldErrors.nisn}
                  aria-describedby={fieldErrors.nisn ? 'nisn-error' : undefined}
                />
                {fieldErrors.nisn && (
                  <p id="nisn-error" className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
                    {fieldErrors.nisn}
                  </p>
                )}
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    clearFieldError('name');
                  }}
                  className="w-full bg-background border-input"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                />
                {fieldErrors.name && (
                  <p id="name-error" className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="gender">Jenis Kelamin</Label>
                <Select
                  value={formGender}
                  onValueChange={(v) => {
                    if (v) {
                      setFormGender(v);
                      clearFieldError('gender');
                    }
                  }}
                >
                  <SelectTrigger
                    id="gender"
                    className="w-full truncate bg-background border-input"
                    aria-invalid={!!fieldErrors.gender}
                    aria-describedby={fieldErrors.gender ? 'gender-error' : undefined}
                  >
                    <SelectValue placeholder="Pilih jenis kelamin">
                      {(val: string | null) => optionLabel(genderOptions, val, 'Pilih jenis kelamin')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border z-50">
                    {genderOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.gender && (
                  <p id="gender-error" className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
                    {fieldErrors.gender}
                  </p>
                )}
              </div>

              <div className="space-y-2 min-w-0">
                <Label htmlFor="class_id">Kelas</Label>
                <Select
                  value={formClassId}
                  onValueChange={(val) => {
                    if (val) handleClassChange(val);
                  }}
                >
                  <SelectTrigger
                    id="class_id"
                    className="w-full truncate bg-background border-input"
                    aria-invalid={!!fieldErrors.class_id}
                    aria-describedby={fieldErrors.class_id ? 'class_id-error' : undefined}
                  >
                    <SelectValue placeholder="Pilih kelas">
                      {(val: string | null) => optionLabel(formClassOptions, val, 'Pilih kelas')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border z-50">
                    {formClassOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.class_id && (
                  <p id="class_id-error" className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
                    {fieldErrors.class_id}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="halaqah_id">Kelas Halaqah</Label>
              <Select
                value={formHalaqahId}
                onValueChange={(v) => {
                  if (v) {
                    setFormHalaqahId(v);
                    clearFieldError('halaqah_id');
                  }
                }}
              >
                <SelectTrigger
                  id="halaqah_id"
                  className="w-full truncate bg-background border-input"
                  aria-invalid={!!fieldErrors.halaqah_id}
                  aria-describedby={fieldErrors.halaqah_id ? 'halaqah_id-error' : undefined}
                >
                  <SelectValue placeholder="Pilih halaqah aktif sesuai kelas">
                    {(val: string | null) => optionLabel(formHalaqahOptions, val, 'Pilih halaqah aktif sesuai kelas')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground border-border z-50">
                  {formHalaqahOptions.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Belum ada halaqah untuk kelas ini
                    </div>
                  ) : (
                    formHalaqahOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {fieldErrors.halaqah_id && (
                <p id="halaqah_id-error" className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
                  {fieldErrors.halaqah_id}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 min-w-0">
                <Label htmlFor="parent_name">Nama Orangtua / Wali</Label>
                <Input
                  id="parent_name"
                  value={formParentName}
                  onChange={(e) => {
                    setFormParentName(e.target.value);
                    clearFieldError('parent_name');
                  }}
                  className="w-full bg-background border-input"
                  aria-invalid={!!fieldErrors.parent_name}
                  aria-describedby={fieldErrors.parent_name ? 'parent_name-error' : undefined}
                />
                {fieldErrors.parent_name && (
                  <p id="parent_name-error" className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
                    {fieldErrors.parent_name}
                  </p>
                )}
              </div>
              <div className="space-y-2 min-w-0">
                <Label htmlFor="parent_whatsapp">WhatsApp Orangtua</Label>
                <Input
                  id="parent_whatsapp"
                  value={formParentWhatsapp}
                  onChange={(e) => {
                    setFormParentWhatsapp(e.target.value);
                    clearFieldError('parent_whatsapp');
                  }}
                  placeholder="081234567890"
                  className="w-full bg-background border-input"
                  aria-invalid={!!fieldErrors.parent_whatsapp}
                  aria-describedby={fieldErrors.parent_whatsapp ? 'parent_whatsapp-error' : undefined}
                />
                {fieldErrors.parent_whatsapp && (
                  <p id="parent_whatsapp-error" className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
                    {fieldErrors.parent_whatsapp}
                  </p>
                )}
              </div>
            </div>

            {editingStudent && (
              <div className="space-y-2 min-w-0">
                <Label htmlFor="status">Status</Label>
                <Select value={formStatus} onValueChange={(v) => v && setFormStatus(v)}>
                  <SelectTrigger id="status" className="w-full truncate bg-background border-input">
                    <SelectValue placeholder="Pilih status">
                      {(val: string | null) => optionLabel(statusOptions, val, 'Pilih status')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border-border z-50">
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog Konfirmasi Status */}
      <AlertDialog
        open={statusDialog.open}
        onOpenChange={(open) => setStatusDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent className="bg-popover text-popover-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusDialog.targetStatus === 'INACTIVE' ? 'Nonaktifkan Santri?' : 'Aktifkan Kembali Santri?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusDialog.targetStatus === 'INACTIVE'
                ? `Apakah Anda yakin ingin menonaktifkan santri ${statusDialog.student?.name}?`
                : `Apakah Anda yakin ingin mengaktifkan kembali santri ${statusDialog.student?.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmStatus} disabled={isPending}>
              {isPending ? 'Memproses...' : 'Ya, Lanjutkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
