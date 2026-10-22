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
import { optionLabel, getGenderOptions, withUstadzTitle } from '@/lib/formatters';
import { validateTeacherDeactivationRule } from '@/lib/validators/ustadz-rules';
import { teacherSchema } from '@/lib/validators/ustadz';
import { zodIssuesToFieldErrors } from '@/lib/validators/common';
import { createTeacher, updateTeacher, setTeacherStatus } from './actions';

export interface ClassOption {
  id: string;
  name: string;
  level: number;
}

export interface TeacherRow {
  id: string;
  name: string;
  gender: string;
  whatsapp: string;
  boarding_school: string | null;
  is_active: boolean;
  halaqah_names: string;
  class_names: string;
}

interface UstadzClientProps {
  teachers: TeacherRow[];
  totalCount: number;
  classes: ClassOption[];
  isAdmin: boolean;
  currentPage: number;
  pageSize: number;
  currentSearch: string;
  currentClass: string;
  currentInactive: boolean;
}

const FIELD_ORDER = ['name', 'gender', 'whatsapp', 'boarding_school'];

export function UstadzClient({
  teachers,
  totalCount,
  classes,
  isAdmin,
  currentPage,
  pageSize,
  currentSearch,
  currentClass,
  currentInactive,
}: UstadzClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(currentSearch);
  const [prevSearch, setPrevSearch] = useState(currentSearch);

  if (currentSearch !== prevSearch) {
    setPrevSearch(currentSearch);
    setSearchInput(currentSearch);
  }

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);

  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formWhatsapp, setFormWhatsapp] = useState('');
  const [formBoarding, setFormBoarding] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const [statusDialog, setStatusDialog] = useState<{
    open: boolean;
    teacher: TeacherRow | null;
    targetActive: boolean;
  }>({
    open: false,
    teacher: null,
    targetActive: false,
  });

  const genderOptions = useMemo(() => getGenderOptions(), []);

  const classFilterOptions = useMemo(() => [
    { value: 'all', label: 'Semua Kelas' },
    ...classes.map((c) => ({ value: c.level.toString(), label: `Kelas ${c.level}` })),
  ], [classes]);

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
    setEditingTeacher(null);
    setFormName('');
    setFormGender('');
    setFormWhatsapp('');
    setFormBoarding('');
    setFieldErrors({});
    setFormError('');
    setIsFormOpen(true);
  }

  function openEditModal(t: TeacherRow) {
    setEditingTeacher(t);
    setFormName(t.name);
    setFormGender(t.gender);
    setFormWhatsapp(t.whatsapp);
    setFormBoarding(t.boarding_school || '');
    setFieldErrors({});
    setFormError('');
    setIsFormOpen(true);
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
      name: formName,
      gender: formGender,
      whatsapp: formWhatsapp,
      boarding_school: formBoarding,
    };

    const parsed = teacherSchema.safeParse(payload);
    if (!parsed.success) {
      const errs = zodIssuesToFieldErrors(parsed.error.issues);
      setFieldErrors(errs);
      const firstInvalid = FIELD_ORDER.find((f) => errs[f]);
      if (firstInvalid) {
        document.getElementById(firstInvalid)?.focus();
      }
      return;
    }

    startTransition(async () => {
      const res = editingTeacher
        ? await updateTeacher(editingTeacher.id, payload)
        : await createTeacher(payload);

      if (res.ok) {
        toast.success(editingTeacher ? 'Data ustadz berhasil diperbarui.' : 'Ustadz berhasil ditambahkan.');
        setIsFormOpen(false);
      } else {
        const errorMsg = res.error || 'Terjadi kesalahan.';
        setFormError(errorMsg);
        toast.error(errorMsg);
      }
    });
  }

  async function handleConfirmStatus() {
    if (!statusDialog.teacher) return;
    const t = statusDialog.teacher;
    const targetActive = statusDialog.targetActive;

    startTransition(async () => {
      const res = await setTeacherStatus(t.id, targetActive);
      if (res.ok) {
        toast.success(`Status ${t.name} berhasil diubah.`);
        setStatusDialog({ open: false, teacher: null, targetActive: false });
      } else {
        setStatusDialog({ open: false, teacher: null, targetActive: false });
        toast.error(res.error || 'Gagal mengubah status ustadz.');
      }
    });
  }

  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const prevQuery = createQueryString({ page: (currentPage - 1).toString() });
  const nextQuery = createQueryString({ page: (currentPage + 1).toString() });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              name="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              maxLength={50}
              placeholder="Cari nama ustadz..."
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

          {isAdmin && (
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={currentInactive}
                onChange={(e) => handleFilterChange('inactive', e.target.checked ? 'true' : null)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4"
              />
              Tampilkan Nonaktif
            </label>
          )}

          {isAdmin && (
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="h-4 w-4" /> Tambah Ustadz
            </Button>
          )}
        </div>
      </div>

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
                <TableHead>Nama Ustadz</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>No WA</TableHead>
                <TableHead>Asal Pondok</TableHead>
                <TableHead>Halaqah yang Diampu</TableHead>
                <TableHead>Kelas</TableHead>
                <TableHead>Status</TableHead>
                {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 9 : 8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    Belum ada data atau tidak ada hasil untuk filter ini.
                  </TableCell>
                </TableRow>
              ) : (
                teachers.map((t, idx) => {
                  const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <TableRow key={t.id} className={!t.is_active ? 'opacity-60 bg-muted/30' : ''}>
                      <TableCell className="font-medium">{rowNumber}</TableCell>
                      <TableCell className="font-semibold">{withUstadzTitle(t.name)}</TableCell>
                      <TableCell>
                        <Badge variant={t.gender === 'L' ? 'default' : 'secondary'}>
                          {t.gender}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{t.whatsapp}</TableCell>
                      <TableCell>{t.boarding_school || '-'}</TableCell>
                      <TableCell>{t.halaqah_names || '-'}</TableCell>
                      <TableCell>{t.class_names || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={t.is_active ? 'outline' : 'destructive'}>
                          {t.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Ustadz"
                            onClick={() => openEditModal(t)}
                            aria-label={`Edit ${t.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {t.is_active ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Nonaktifkan Ustadz"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setStatusDialog({ open: true, teacher: t, targetActive: false })}
                              aria-label={`Nonaktifkan ${t.name}`}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Aktifkan Kembali"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => setStatusDialog({ open: true, teacher: t, targetActive: true })}
                              aria-label={`Aktifkan ${t.name}`}
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

        <div className="flex items-center justify-between p-4 border-t text-sm text-muted-foreground">
          <div>
            Menampilkan {teachers.length} dari {totalCount} ustadz
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

      {/* Dialog Tambah/Edit */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg bg-popover text-popover-foreground">
          <DialogHeader>
            <DialogTitle>{editingTeacher ? 'Edit Data Ustadz' : 'Tambah Ustadz Baru'}</DialogTitle>
            <DialogDescription>
              Isi formulir data ustadz di bawah ini dengan lengkap.
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
                <Label htmlFor="whatsapp">Nomor WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={formWhatsapp}
                  onChange={(e) => {
                    setFormWhatsapp(e.target.value);
                    clearFieldError('whatsapp');
                  }}
                  placeholder="081234567890"
                  className="w-full bg-background border-input"
                  aria-invalid={!!fieldErrors.whatsapp}
                  aria-describedby={fieldErrors.whatsapp ? 'whatsapp-error' : undefined}
                />
                {fieldErrors.whatsapp && (
                  <p id="whatsapp-error" className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
                    {fieldErrors.whatsapp}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2 min-w-0">
              <Label htmlFor="boarding_school">Asal Pondok (Opsional)</Label>
              <Input
                id="boarding_school"
                value={formBoarding}
                onChange={(e) => {
                  setFormBoarding(e.target.value);
                  clearFieldError('boarding_school');
                }}
                className="w-full bg-background border-input"
                aria-invalid={!!fieldErrors.boarding_school}
                aria-describedby={fieldErrors.boarding_school ? 'boarding_school-error' : undefined}
              />
              {fieldErrors.boarding_school && (
                <p id="boarding_school-error" className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
                  {fieldErrors.boarding_school}
                </p>
              )}
            </div>

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
              {!statusDialog.targetActive ? 'Nonaktifkan Ustadz?' : 'Aktifkan Kembali Ustadz?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {(() => {
                const t = statusDialog.teacher;
                return !statusDialog.targetActive
                  ? `Apakah Anda yakin ingin menonaktifkan ustadz ${t?.name}?`
                  : `Apakah Anda yakin ingin mengaktifkan kembali ustadz ${t?.name}?`;
              })()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {(() => {
            const t = statusDialog.teacher;
            if (!statusDialog.targetActive && t) {
              const halaqahList = t.halaqah_names ? t.halaqah_names.split(', ').map(n => ({ name: n })) : [];
              const rule = validateTeacherDeactivationRule(halaqahList);
              if (!rule.valid) {
                return (
                  <div className="p-3 bg-destructive/10 text-destructive rounded-md font-medium text-sm" role="alert" aria-live="polite">
                    {rule.error}
                  </div>
                );
              }
            }
            return null;
          })()}
          <AlertDialogFooter>
            <AlertDialogCancel>
              {(() => {
                const t = statusDialog.teacher;
                if (!statusDialog.targetActive && t) {
                  const halaqahList = t.halaqah_names ? t.halaqah_names.split(', ').map(n => ({ name: n })) : [];
                  const rule = validateTeacherDeactivationRule(halaqahList);
                  if (!rule.valid) return 'Tutup';
                }
                return 'Batal';
              })()}
            </AlertDialogCancel>
            {(() => {
              const t = statusDialog.teacher;
              if (!statusDialog.targetActive && t) {
                const halaqahList = t.halaqah_names ? t.halaqah_names.split(', ').map(n => ({ name: n })) : [];
                const rule = validateTeacherDeactivationRule(halaqahList);
                if (!rule.valid) {
                  return (
                    <AlertDialogAction disabled onClick={handleConfirmStatus}>
                      Ya, Lanjutkan
                    </AlertDialogAction>
                  );
                }
              }
              return (
                <AlertDialogAction onClick={handleConfirmStatus} disabled={isPending}>
                  {isPending ? 'Memproses...' : 'Ya, Lanjutkan'}
                </AlertDialogAction>
              );
            })()}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
