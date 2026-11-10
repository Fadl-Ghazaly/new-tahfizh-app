'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { optionLabel } from '@/lib/formatters';
import {
  SchoolSettingsInput,
  schoolSettingsSchema,
  UserProfileInput,
  userProfileSchema,
  ChangePasswordInput,
  changePasswordSchema,
  THEME_OPTIONS,
} from '@/lib/validators/pengaturan';
import {
  updateSchoolSettingsAction,
  updateUserProfileAction,
  changePasswordAction,
} from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  User,
  KeyRound,
  GraduationCap,
  Palette,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

export interface PengaturanClientProps {
  role: 'ADMIN' | 'USTADZ';
  userProfile: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  schoolSettings: {
    schoolName: string;
    logoUrl: string | null;
    theme: string;
  };
}

type TabType = 'profile' | 'school' | 'academic';

export function PengaturanClient({
  role,
  userProfile,
  schoolSettings,
}: PengaturanClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isPending, startTransition] = useTransition();

  // Status feedback alerts
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [schoolMessage, setSchoolMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // 1. Form Profil Pengguna
  const profileForm = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      full_name: userProfile.fullName,
      phone: userProfile.phone || '',
    },
  });

  // 2. Form Ganti Password
  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  // 3. Form Sekolah (Khusus ADMIN)
  const [selectedTheme, setSelectedTheme] = useState<SchoolSettingsInput['theme']>(
    (schoolSettings.theme as 'theme-1') || 'theme-1'
  );
  const schoolForm = useForm<SchoolSettingsInput>({
    resolver: zodResolver(schoolSettingsSchema),
    defaultValues: {
      school_name: schoolSettings.schoolName,
      logo_url: schoolSettings.logoUrl || '',
      theme: (schoolSettings.theme as 'theme-1') || 'theme-1',
    },
  });

  // Handler Submit Profil
  const onSubmitProfile = (data: UserProfileInput) => {
    setProfileMessage(null);
    startTransition(async () => {
      const res = await updateUserProfileAction(data);
      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Profil pengguna berhasil diperbarui.' });
        router.refresh();
      } else {
        setProfileMessage({ type: 'error', text: res.error || 'Gagal memperbarui profil.' });
      }
    });
  };

  // Handler Submit Password
  const onSubmitPassword = (data: ChangePasswordInput) => {
    setPasswordMessage(null);
    startTransition(async () => {
      const res = await changePasswordAction(data);
      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Kata sandi berhasil diperbarui.' });
        passwordForm.reset();
      } else {
        setPasswordMessage({ type: 'error', text: res.error || 'Gagal memperbarui kata sandi.' });
      }
    });
  };

  // Handler Submit Pengaturan Sekolah
  const onSubmitSchool = (data: SchoolSettingsInput) => {
    setSchoolMessage(null);
    startTransition(async () => {
      const res = await updateSchoolSettingsAction(data);
      if (res.ok) {
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('data-theme', data.theme);
        }
        setSchoolMessage({ type: 'success', text: 'Pengaturan pesantren berhasil disimpan.' });
        router.refresh();
      } else {
        setSchoolMessage({ type: 'error', text: res.error || 'Gagal menyimpan pengaturan.' });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar Navigasi Tab Pengaturan */}
      <div className="md:col-span-1 space-y-2">
        <div className="p-4 bg-card rounded-xl border shadow-sm space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            <span>Profil &amp; Akun</span>
          </button>

          {role === 'ADMIN' && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('school')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === 'school'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span>Identitas Pesantren</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('academic')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === 'academic'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <GraduationCap className="h-4 w-4 shrink-0" />
                <span>Akademik &amp; Periode</span>
              </button>
            </>
          )}
        </div>

        {/* Informasi Akun Info Card */}
        <div className="p-4 bg-muted/40 rounded-xl border text-xs space-y-2 text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Hak Akses:</span>
            <Badge variant="outline" className="font-semibold text-primary">
              {role}
            </Badge>
          </div>
          <p className="leading-relaxed">
            {role === 'ADMIN'
              ? 'Anda memiliki hak penuh untuk mengelola konfigurasi sistem dan identitas pesantren.'
              : 'Anda memiliki akses terbatas untuk memperbarui profil dan keamanan akun pribadi.'}
          </p>
        </div>
      </div>

      {/* Konten Tab Aktif */}
      <div className="md:col-span-3 space-y-6">
        {/* TAB 1: PROFIL & AKUN */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Card Edit Profil */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Informasi Profil Pengguna
                </CardTitle>
                <CardDescription>
                  Perbarui nama lengkap dan nomor telepon/WhatsApp Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
                  {profileMessage && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                        profileMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                          : 'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}
                    >
                      {profileMessage.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span>{profileMessage.text}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs">
                        Alamat Email (Akun)
                      </Label>
                      <Input
                        id="email"
                        value={userProfile.email}
                        disabled
                        className="bg-muted text-muted-foreground cursor-not-allowed text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">Email terikat ke akun autentikasi.</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="full_name" className="text-xs">
                        Nama Lengkap <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="full_name"
                        {...profileForm.register('full_name')}
                        placeholder="Contoh: Ust. Ahmad Fauzi"
                        className="text-sm"
                      />
                      {profileForm.formState.errors.full_name && (
                        <p className="text-[11px] text-destructive">
                          {profileForm.formState.errors.full_name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="phone" className="text-xs">
                        Nomor WhatsApp / Telepon
                      </Label>
                      <Input
                        id="phone"
                        {...profileForm.register('phone')}
                        placeholder="Contoh: 081234567890"
                        className="text-sm max-w-sm"
                      />
                      {profileForm.formState.errors.phone && (
                        <p className="text-[11px] text-destructive">
                          {profileForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button type="submit" disabled={isPending} size="sm">
                      {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                      Simpan Profil
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Card Ganti Kata Sandi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Keamanan &amp; Kata Sandi
                </CardTitle>
                <CardDescription>
                  Ganti kata sandi akun Anda untuk menjaga keamanan akses sistem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-4">
                  {passwordMessage && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                        passwordMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                          : 'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}
                    >
                      {passwordMessage.type === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 shrink-0" />
                      )}
                      <span>{passwordMessage.text}</span>
                    </div>
                  )}

                  <div className="space-y-3 max-w-md">
                    <div className="space-y-1.5">
                      <Label htmlFor="current_password" className="text-xs">
                        Kata Sandi Saat Ini <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="current_password"
                          type={showCurrentPassword ? 'text' : 'password'}
                          {...passwordForm.register('current_password')}
                          placeholder="Masukkan kata sandi saat ini"
                          className="pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.current_password && (
                        <p className="text-[11px] text-destructive">
                          {passwordForm.formState.errors.current_password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="new_password" className="text-xs">
                        Kata Sandi Baru <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="new_password"
                          type={showNewPassword ? 'text' : 'password'}
                          {...passwordForm.register('new_password')}
                          placeholder="Minimal 6 karakter"
                          className="pr-10 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {passwordForm.formState.errors.new_password && (
                        <p className="text-[11px] text-destructive">
                          {passwordForm.formState.errors.new_password.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirm_password" className="text-xs">
                        Ulangi Kata Sandi Baru <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="confirm_password"
                        type={showNewPassword ? 'text' : 'password'}
                        {...passwordForm.register('confirm_password')}
                        placeholder="Ketik ulang kata sandi baru"
                        className="text-sm"
                      />
                      {passwordForm.formState.errors.confirm_password && (
                        <p className="text-[11px] text-destructive">
                          {passwordForm.formState.errors.confirm_password.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-start">
                    <Button type="submit" disabled={isPending} variant="outline" size="sm">
                      {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                      Perbarui Kata Sandi
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: IDENTITAS PESANTREN (ADMIN ONLY) */}
        {activeTab === 'school' && role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Identitas Pesantren &amp; Visual Aplikasi
              </CardTitle>
              <CardDescription>
                Kelola nama resmi lembaga, URL logo, dan tema tampilan aplikasi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={schoolForm.handleSubmit(onSubmitSchool)} className="space-y-5">
                {schoolMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      schoolMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}
                  >
                    {schoolMessage.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{schoolMessage.text}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="school_name" className="text-xs">
                      Nama Resmi Pesantren / Lembaga <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="school_name"
                      {...schoolForm.register('school_name')}
                      placeholder="Contoh: Pesantren Darul Ilmi"
                      className="text-sm"
                    />
                    {schoolForm.formState.errors.school_name && (
                      <p className="text-[11px] text-destructive">
                        {schoolForm.formState.errors.school_name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="logo_url" className="text-xs">
                      URL Logo Sekolah / Pesantren
                    </Label>
                    <Input
                      id="logo_url"
                      {...schoolForm.register('logo_url')}
                      placeholder="https://example.com/logo.png"
                      className="text-sm"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Kosongkan jika ingin menggunakan ikon Al-Quran bawaan sistem.
                    </p>
                    {schoolForm.formState.errors.logo_url && (
                      <p className="text-[11px] text-destructive">
                        {schoolForm.formState.errors.logo_url.message}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-primary" />
                      Tema Tampilan Visual Sistem
                    </Label>
                    <Select
                      value={selectedTheme}
                      onValueChange={(val) => {
                        if (!val) return;
                        const themeVal = val as SchoolSettingsInput['theme'];
                        setSelectedTheme(themeVal);
                        schoolForm.setValue('theme', themeVal);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-72">
                        <SelectValue placeholder="Pilih Tema">
                          {(val: string | null) =>
                            optionLabel([...THEME_OPTIONS], val, 'Pilih Tema')
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {THEME_OPTIONS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Tema warna ini diterapkan secara global pada sidebar dan aksen komponen aplikasi.
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={isPending} size="sm">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    Simpan Perubahan Pesantren
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: AKADEMIK & PERIODE (ADMIN ONLY) */}
        {activeTab === 'academic' && role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Konfigurasi Akademik &amp; Tahun Ajaran
              </CardTitle>
              <CardDescription>
                Informasi tahun ajaran aktif, semester berjalan, dan standar kurikulum tahfizh.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Tahun Ajaran Aktif</span>
                  <span className="text-base font-bold text-foreground">2026/2027</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block font-medium">
                    &bull; Sedang Berjalan
                  </span>
                </div>

                <div className="p-4 rounded-xl border bg-muted/20 space-y-1">
                  <span className="text-xs text-muted-foreground block">Semester Aktif</span>
                  <span className="text-base font-bold text-foreground">Semester Ganjil</span>
                  <span className="text-[11px] text-muted-foreground block">Juli &ndash; Desember</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border bg-primary/5 space-y-2 text-xs">
                <div className="font-semibold text-primary flex items-center gap-1.5">
                  <Building2 className="h-4 w-4" />
                  Standar Perhitungan Mushaf Tahfizh:
                </div>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Standar Mushaf Madinah: <strong>1 Halaman = 15 Baris</strong>.</li>
                  <li>Standar Juz: <strong>1 Juz = 20 Halaman = 300 Baris</strong>.</li>
                  <li>Target Khatam 30 Juz = <strong>9.000 Baris</strong>.</li>
                  <li>Nilai kelancaran awal 100, berkurang 5 poin setiap catatan kesalahan ustadz.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
