'use client';

import { useRef, useState, useSyncExternalStore, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { optionLabel } from '@/lib/formatters';
import {
  SchoolSettingsInput,
  schoolSettingsSchema,
  AcademicSettingsInput,
  academicSettingsSchema,
  UserProfileInput,
  userProfileSchema,
  ChangePasswordInput,
  changePasswordSchema,
  AdminResetPasswordInput,
  adminResetPasswordSchema,
  THEME_OPTIONS,
  ACADEMIC_YEAR_OPTIONS,
  SEMESTER_OPTIONS,
  ALLOWED_LOGO_MIME_TYPES,
  MAX_LOGO_SIZE_BYTES,
} from '@/lib/validators/pengaturan';
import {
  updateSchoolSettingsAction,
  updateAcademicSettingsAction,
  updateUserProfileAction,
  changePasswordAction,
  toggleUserStatusAction,
  adminResetPasswordAction,
} from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Building2,
  User,
  Users,
  KeyRound,
  GraduationCap,
  Palette,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  Power,
  ShieldCheck,
} from 'lucide-react';

export interface ManagedUserRow {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USTADZ';
  phone: string | null;
  isActive: boolean;
  lastSignInAt: string | null;
}

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
  academicSettings: AcademicSettingsInput;
  managedUsers: ManagedUserRow[];
}

type TabType = 'profile' | 'users' | 'school' | 'academic';

const emptySubscribe = () => () => {};

function formatLastLogin(iso: string | null): string {
  if (!iso) return 'Belum pernah';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Belum pernah';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  });
}

function updateBrowserFavicon(logoUrl: string | null) {
  if (typeof document === 'undefined') return;
  const href = logoUrl && logoUrl.trim().length > 0 ? logoUrl : '/favicon.ico';
  let link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = href;
}

export function PengaturanClient({
  role,
  userProfile,
  schoolSettings,
  academicSettings,
  managedUsers,
}: PengaturanClientProps) {
  const router = useRouter();
  const isHydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Status feedback alerts
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [schoolMessage, setSchoolMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [academicMessage, setAcademicMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [usersMessage, setUsersMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // State Modal Reset Password Pengguna (oleh Admin)
  const [resetTargetUser, setResetTargetUser] = useState<ManagedUserRow | null>(null);
  const [resetDialogMessage, setResetDialogMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showAdminResetPassword, setShowAdminResetPassword] = useState(false);

  // 1. Form Profil Pengguna Pribadi
  const profileForm = useForm<UserProfileInput>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: {
      full_name: userProfile.fullName,
      phone: userProfile.phone || '',
    },
  });

  // 2. Form Ganti Password Pribadi
  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  });

  // 3. Form Identitas Pesantren (Khusus ADMIN)
  const [selectedTheme, setSelectedTheme] = useState<SchoolSettingsInput['theme']>(
    (schoolSettings.theme as SchoolSettingsInput['theme']) || 'theme-1'
  );
  const [logoPreview, setLogoPreview] = useState<string>(schoolSettings.logoUrl || '');
  const [logoFileName, setLogoFileName] = useState<string>('');

  const schoolForm = useForm<SchoolSettingsInput>({
    resolver: zodResolver(schoolSettingsSchema),
    defaultValues: {
      school_name: schoolSettings.schoolName,
      logo_url: schoolSettings.logoUrl || '',
      theme: (schoolSettings.theme as SchoolSettingsInput['theme']) || 'theme-1',
    },
  });

  // 4. Form Konfigurasi Akademik (Khusus ADMIN)
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(
    academicSettings.academic_year
  );
  const [selectedSemester, setSelectedSemester] = useState<'GANJIL' | 'GENAP'>(
    academicSettings.semester
  );

  const academicForm = useForm<AcademicSettingsInput>({
    resolver: zodResolver(academicSettingsSchema),
    defaultValues: {
      academic_year: academicSettings.academic_year,
      semester: academicSettings.semester,
      lines_per_page: academicSettings.lines_per_page,
      lines_per_juz: academicSettings.lines_per_juz,
      mistake_penalty: academicSettings.mistake_penalty,
    },
  });

  // 5. Form Reset Password oleh Admin
  const adminResetForm = useForm<AdminResetPasswordInput>({
    resolver: zodResolver(adminResetPasswordSchema),
    defaultValues: {
      user_id: '',
      new_password: '',
      confirm_password: '',
    },
  });

  // Handler Upload File Logo -> Base64 Data URL
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSchoolMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes: readonly string[] = ALLOWED_LOGO_MIME_TYPES;
    const isAllowedExt = /\.(png|jpe?g|svg|webp|ico)$/i.test(file.name);
    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
      setSchoolMessage({
        type: 'error',
        text: 'Format berkas tidak didukung. Gunakan PNG, JPG, SVG, WebP, atau ICO.',
      });
      e.target.value = '';
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setSchoolMessage({
        type: 'error',
        text: 'Ukuran berkas terlalu besar. Maksimal ukuran logo adalah 2MB.',
      });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLogoPreview(reader.result);
        setLogoFileName(file.name);
        schoolForm.setValue('logo_url', reader.result, { shouldValidate: true });
      }
    };
    reader.onerror = () => {
      setSchoolMessage({
        type: 'error',
        text: 'Gagal membaca berkas gambar. Silakan coba berkas lain.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleClearLogo = () => {
    setLogoPreview('');
    setLogoFileName('');
    schoolForm.setValue('logo_url', '', { shouldValidate: true });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handler Submit Profil Pribadi
  const onSubmitProfile = (data: UserProfileInput) => {
    setProfileMessage(null);
    startTransition(async () => {
      const res = await updateUserProfileAction(data);
      if (res.ok) {
        setProfileMessage({ type: 'success', text: 'Profil pengguna berhasil diperbarui.' });
        router.refresh();
      } else {
        setProfileMessage({
          type: 'error',
          text: res.error || 'Gagal memperbarui profil.',
        });
      }
    });
  };

  // Handler Submit Password Pribadi
  const onSubmitPassword = (data: ChangePasswordInput) => {
    setPasswordMessage(null);
    startTransition(async () => {
      const res = await changePasswordAction(data);
      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Kata sandi berhasil diperbarui.' });
        passwordForm.reset();
      } else {
        setPasswordMessage({
          type: 'error',
          text: res.error || 'Gagal memperbarui kata sandi.',
        });
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
        updateBrowserFavicon(data.logo_url || null);
        setSchoolMessage({
          type: 'success',
          text: 'Identitas pesantren, logo, dan tema berhasil disimpan serta disinkronkan.',
        });
        router.refresh();
      } else {
        setSchoolMessage({
          type: 'error',
          text: res.error || 'Gagal menyimpan pengaturan.',
        });
      }
    });
  };

  // Handler Submit Konfigurasi Akademik
  const onSubmitAcademic = (data: AcademicSettingsInput) => {
    setAcademicMessage(null);
    startTransition(async () => {
      const res = await updateAcademicSettingsAction(data);
      if (res.ok) {
        setAcademicMessage({
          type: 'success',
          text: 'Konfigurasi akademik dan standar perhitungan tahfizh berhasil disimpan.',
        });
        router.refresh();
      } else {
        setAcademicMessage({
          type: 'error',
          text: res.error || 'Gagal menyimpan konfigurasi akademik.',
        });
      }
    });
  };

  // Handler Toggle Status Akun oleh Admin
  const handleToggleUserStatus = (targetUser: ManagedUserRow) => {
    setUsersMessage(null);
    const nextStatus = !targetUser.isActive;
    startTransition(async () => {
      const res = await toggleUserStatusAction({
        user_id: targetUser.id,
        is_active: nextStatus,
      });
      if (res.ok) {
        setUsersMessage({
          type: 'success',
          text: `Status akun "${targetUser.fullName}" berhasil diubah menjadi ${
            nextStatus ? 'Aktif' : 'Nonaktif'
          }.`,
        });
        router.refresh();
      } else {
        setUsersMessage({
          type: 'error',
          text: res.error || 'Gagal mengubah status akun pengguna.',
        });
      }
    });
  };

  // Handler Buka Modal Reset Password oleh Admin
  const openAdminResetModal = (targetUser: ManagedUserRow) => {
    setResetTargetUser(targetUser);
    setResetDialogMessage(null);
    setShowAdminResetPassword(false);
    adminResetForm.reset({
      user_id: targetUser.id,
      new_password: '',
      confirm_password: '',
    });
  };

  // Handler Submit Reset Password oleh Admin
  const onSubmitAdminResetPassword = (data: AdminResetPasswordInput) => {
    setResetDialogMessage(null);
    startTransition(async () => {
      const res = await adminResetPasswordAction(data);
      if (res.ok) {
        setUsersMessage({
          type: 'success',
          text: `Kata sandi untuk "${resetTargetUser?.fullName || 'Pengguna'}" berhasil direset.`,
        });
        setResetTargetUser(null);
        adminResetForm.reset();
        router.refresh();
      } else {
        setResetDialogMessage({
          type: 'error',
          text: res.error || 'Gagal mereset kata sandi pengguna.',
        });
      }
    });
  };

  const academicYearSelectOptions = (() => {
    const list: Array<{ value: string; label: string }> = [...ACADEMIC_YEAR_OPTIONS];
    if (!list.some((item) => item.value === selectedAcademicYear)) {
      list.push({ value: selectedAcademicYear, label: selectedAcademicYear });
    }
    return list;
  })();

  if (!isHydrated) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
        <div className="md:col-span-1 space-y-2">
          <div className="p-4 bg-card rounded-xl border shadow-sm space-y-2">
            <div className="h-10 bg-muted rounded-lg" />
            <div className="h-10 bg-muted rounded-lg" />
            <div className="h-10 bg-muted rounded-lg" />
            <div className="h-10 bg-muted rounded-lg" />
          </div>
        </div>
        <div className="md:col-span-3 space-y-6">
          <div className="p-6 bg-card rounded-xl border shadow-sm space-y-4">
            <div className="h-5 w-48 bg-muted rounded" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
            <div className="h-10 w-36 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar Navigasi Tab Pengaturan */}
      <div className="md:col-span-1 space-y-2">
        <div className="p-4 bg-card rounded-xl border shadow-sm space-y-1">
          <button
            type="button"
            suppressHydrationWarning
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            <span>Profil &amp; Akun Pribadi</span>
          </button>

          {role === 'ADMIN' && (
            <>
              <button
                type="button"
                suppressHydrationWarning
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeTab === 'users'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>Manajemen Pengguna &amp; Akun</span>
              </button>

              <button
                type="button"
                suppressHydrationWarning
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
                suppressHydrationWarning
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
              ? 'Anda memiliki kontrol penuh atas manajemen akun pengguna, identitas pesantren, dan konfigurasi akademik.'
              : 'Anda dapat memperbarui informasi profil dan keamanan kata sandi akun pribadi Anda.'}
          </p>
        </div>
      </div>

      {/* Konten Tab Aktif */}
      <div className="md:col-span-3 space-y-6">
        {/* TAB 1: PROFIL & AKUN PRIBADI */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Informasi Profil Pengguna
                </CardTitle>
                <CardDescription>
                  Perbarui nama lengkap dan nomor telepon/WhatsApp pribadi Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                  className="space-y-4"
                >
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
                      <p className="text-[11px] text-muted-foreground">
                        Email terikat ke akun autentikasi.
                      </p>
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
                  Keamanan &amp; Kata Sandi Pribadi
                </CardTitle>
                <CardDescription>
                  Ganti kata sandi akun Anda untuk menjaga keamanan akses sistem.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                  className="space-y-4"
                >
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
                          {showCurrentPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
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
                          {showNewPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
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

        {/* TAB 2: MANAJEMEN PENGGUNA & AKUN (ADMIN ONLY) */}
        {activeTab === 'users' && role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Manajemen Pengguna &amp; Akun Sistem
                  </CardTitle>
                  <CardDescription>
                    Kelola akses login seluruh akun Admin dan Ustadz, aktifkan/nonaktifkan akun, atau reset kata sandi.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="w-fit text-xs">
                  Total: {managedUsers.length} Akun
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {usersMessage && (
                <div
                  className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                    usersMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      : 'bg-destructive/10 text-destructive border border-destructive/20'
                  }`}
                >
                  {usersMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{usersMessage.text}</span>
                </div>
              )}

              <div className="rounded-xl border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs font-semibold">Nama Lengkap</TableHead>
                      <TableHead className="text-xs font-semibold">Email</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Role</TableHead>
                      <TableHead className="text-xs font-semibold text-center">Status</TableHead>
                      <TableHead className="text-xs font-semibold">Terakhir Login</TableHead>
                      <TableHead className="text-xs font-semibold text-right">Aksi Administratif</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {managedUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-sm text-muted-foreground">
                          Belum ada data pengguna terdaftar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      managedUsers.map((u) => {
                        const isSelf = u.id === userProfile.id;
                        return (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
                                <span>{u.fullName}</span>
                                {isSelf && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    Anda
                                  </Badge>
                                )}
                              </div>
                              {u.phone && (
                                <div className="text-[11px] text-muted-foreground">{u.phone}</div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {u.email}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={u.role === 'ADMIN' ? 'default' : 'outline'}
                                className="text-[11px]"
                              >
                                {u.role}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {u.isActive ? (
                                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px]">
                                  Aktif
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[11px]">
                                  Nonaktif
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {formatLastLogin(u.lastSignInAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={u.isActive ? 'outline' : 'default'}
                                  disabled={isPending || isSelf}
                                  title={
                                    isSelf
                                      ? 'Tidak dapat menonaktifkan akun sendiri'
                                      : u.isActive
                                      ? 'Nonaktifkan akun pengguna'
                                      : 'Aktifkan kembali akun pengguna'
                                  }
                                  onClick={() => handleToggleUserStatus(u)}
                                  className="h-8 text-xs"
                                >
                                  <Power className="h-3.5 w-3.5 mr-1" />
                                  {u.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                                </Button>

                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  disabled={isPending}
                                  onClick={() => openAdminResetModal(u)}
                                  className="h-8 text-xs"
                                >
                                  <KeyRound className="h-3.5 w-3.5 mr-1" />
                                  Reset Password
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: IDENTITAS PESANTREN (ADMIN ONLY) */}
        {activeTab === 'school' && role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Identitas Pesantren &amp; Visual Aplikasi
              </CardTitle>
              <CardDescription>
                Kelola nama resmi lembaga, unggah logo &amp; favicon pesantren, serta pilih tema warna aplikasi.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={schoolForm.handleSubmit(onSubmitSchool)}
                className="space-y-5"
              >
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

                  <Separator />

                  {/* Upload File Logo & Live Preview */}
                  <div className="space-y-3">
                    <Label htmlFor="logo_file" className="text-xs font-medium block">
                      Unggah Logo Pesantren &amp; Favicon Browser
                    </Label>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl border bg-muted/20">
                      {/* Kotak Live Preview */}
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border bg-card shadow-xs overflow-hidden">
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoPreview}
                            alt="Pratinjau Logo Pesantren"
                            className="h-16 w-16 object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <Building2 className="h-8 w-8 text-primary/70" />
                            <span className="text-[10px] mt-1">Default</span>
                          </div>
                        )}
                      </div>

                      {/* Kontrol File Input */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            ref={fileInputRef}
                            id="logo_file"
                            type="file"
                            accept=".png,.jpg,.jpeg,.svg,.webp,.ico,image/png,image/jpeg,image/svg+xml,image/webp,image/x-icon"
                            onChange={handleLogoFileChange}
                            className="text-xs max-w-xs cursor-pointer"
                          />
                          {logoPreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleClearLogo}
                              className="h-8 text-xs text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Reset Logo
                            </Button>
                          )}
                        </div>

                        {logoFileName && (
                          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Upload className="h-3.5 w-3.5" />
                            Berkas dipilih: {logoFileName}
                          </p>
                        )}

                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Format yang didukung: <strong>PNG, JPG, SVG, WebP, ICO</strong> (Maks. 2MB).
                          Logo yang disimpan otomatis diperbarui pada Sidebar aplikasi, Kop Surat Laporan Cetak, dan Favicon tab browser.
                        </p>

                        {schoolForm.formState.errors.logo_url && (
                          <p className="text-[11px] text-destructive">
                            {schoolForm.formState.errors.logo_url.message}
                          </p>
                        )}
                      </div>
                    </div>
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

        {/* TAB 4: AKADEMIK & PERIODE (ADMIN ONLY — INTERAKTIF) */}
        {activeTab === 'academic' && role === 'ADMIN' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Konfigurasi Akademik &amp; Standar Perhitungan Tahfizh
              </CardTitle>
              <CardDescription>
                Atur tahun ajaran aktif, semester berjalan, serta parameter standar perhitungan baris dan nilai kelancaran tahfizh.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={academicForm.handleSubmit(onSubmitAcademic)}
                className="space-y-5"
              >
                {academicMessage && (
                  <div
                    className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                      academicMessage.type === 'success'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        : 'bg-destructive/10 text-destructive border border-destructive/20'
                    }`}
                  >
                    {academicMessage.type === 'success' ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 shrink-0" />
                    )}
                    <span>{academicMessage.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tahun Ajaran Aktif */}
                  <div className="space-y-1.5">
                    <Label htmlFor="academic_year" className="text-xs">
                      Tahun Ajaran Aktif <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={selectedAcademicYear}
                      onValueChange={(val) => {
                        if (!val) return;
                        setSelectedAcademicYear(val);
                        academicForm.setValue('academic_year', val, { shouldValidate: true });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Tahun Ajaran">
                          {(val: string | null) =>
                            optionLabel(academicYearSelectOptions, val, 'Pilih Tahun Ajaran')
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {academicYearSelectOptions.map((y) => (
                          <SelectItem key={y.value} value={y.value}>
                            {y.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {academicForm.formState.errors.academic_year && (
                      <p className="text-[11px] text-destructive">
                        {academicForm.formState.errors.academic_year.message}
                      </p>
                    )}
                  </div>

                  {/* Semester Aktif */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Semester Aktif <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={selectedSemester}
                      onValueChange={(val) => {
                        if (!val) return;
                        const sem = val as 'GANJIL' | 'GENAP';
                        setSelectedSemester(sem);
                        academicForm.setValue('semester', sem, { shouldValidate: true });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih Semester">
                          {(val: string | null) =>
                            optionLabel([...SEMESTER_OPTIONS], val, 'Pilih Semester')
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {SEMESTER_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {academicForm.formState.errors.semester && (
                      <p className="text-[11px] text-destructive">
                        {academicForm.formState.errors.semester.message}
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Parameter Standar Perhitungan Tahfizh */}
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    Parameter Standar Perhitungan Mushaf &amp; Kelancaran
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="lines_per_page" className="text-xs">
                        Baris per Halaman <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lines_per_page"
                        type="number"
                        min={1}
                        max={50}
                        {...academicForm.register('lines_per_page', { valueAsNumber: true })}
                        className="text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Standar Mushaf Madinah: 15 baris.
                      </p>
                      {academicForm.formState.errors.lines_per_page && (
                        <p className="text-[11px] text-destructive">
                          {academicForm.formState.errors.lines_per_page.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="lines_per_juz" className="text-xs">
                        Baris per Juz <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="lines_per_juz"
                        type="number"
                        min={10}
                        max={1000}
                        {...academicForm.register('lines_per_juz', { valueAsNumber: true })}
                        className="text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Standar 20 halaman: 300 baris.
                      </p>
                      {academicForm.formState.errors.lines_per_juz && (
                        <p className="text-[11px] text-destructive">
                          {academicForm.formState.errors.lines_per_juz.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mistake_penalty" className="text-xs">
                        Pengurangan Nilai / Salah <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="mistake_penalty"
                        type="number"
                        min={1}
                        max={100}
                        {...academicForm.register('mistake_penalty', { valueAsNumber: true })}
                        className="text-sm"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        Default: -5 poin per kesalahan.
                      </p>
                      {academicForm.formState.errors.mistake_penalty && (
                        <p className="text-[11px] text-destructive">
                          {academicForm.formState.errors.mistake_penalty.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={isPending} size="sm">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                    Simpan Konfigurasi Akademik
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal Dialog Reset Password Pengguna (Khusus ADMIN) */}
      <Dialog
        open={Boolean(resetTargetUser)}
        onOpenChange={(open) => {
          if (!open) setResetTargetUser(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" />
              Reset Kata Sandi Pengguna
            </DialogTitle>
            <DialogDescription className="text-xs">
              Atur kata sandi baru untuk akun{' '}
              <strong>{resetTargetUser?.fullName}</strong> ({resetTargetUser?.email}).
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={adminResetForm.handleSubmit(onSubmitAdminResetPassword)}
            className="space-y-4 py-2"
          >
            {resetDialogMessage && (
              <div className="p-3 rounded-lg text-xs flex items-center gap-2 bg-destructive/10 text-destructive border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{resetDialogMessage.text}</span>
              </div>
            )}

            <input type="hidden" {...adminResetForm.register('user_id')} />

            <div className="space-y-1.5">
              <Label htmlFor="admin_new_password" className="text-xs">
                Kata Sandi Baru <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="admin_new_password"
                  type={showAdminResetPassword ? 'text' : 'password'}
                  {...adminResetForm.register('new_password')}
                  placeholder="Minimal 6 karakter"
                  className="pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminResetPassword(!showAdminResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showAdminResetPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {adminResetForm.formState.errors.new_password && (
                <p className="text-[11px] text-destructive">
                  {adminResetForm.formState.errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin_confirm_password" className="text-xs">
                Konfirmasi Kata Sandi Baru <span className="text-destructive">*</span>
              </Label>
              <Input
                id="admin_confirm_password"
                type={showAdminResetPassword ? 'text' : 'password'}
                {...adminResetForm.register('confirm_password')}
                placeholder="Ketik ulang kata sandi baru"
                className="text-sm"
              />
              {adminResetForm.formState.errors.confirm_password && (
                <p className="text-[11px] text-destructive">
                  {adminResetForm.formState.errors.confirm_password.message}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setResetTargetUser(null)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                Simpan Kata Sandi Baru
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
