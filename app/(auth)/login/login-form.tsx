"use client";

import { useState, useTransition, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { loginAction } from "./actions";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().email({ message: "Format email tidak valid" }),
  password: z.string().min(1, { message: "Kata sandi wajib diisi" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm({
  schoolName,
  logoUrl,
}: {
  schoolName: string;
  logoUrl: string | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect_to") || "/dashboard";
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Toast untuk logout sukses atau akun tidak aktif
  useEffect(() => {
    if (searchParams.get('logout') === 'success') {
      toast.success('Anda telah keluar');
    }
    if (searchParams.get('error') === 'inactive') {
      toast.error('Akun Anda tidak aktif. Silakan hubungi admin.');
    }
  }, [searchParams]);

  const { control, handleSubmit } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: LoginFormValues) => {
    setErrorMessage(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (result?.error) {
        setErrorMessage(result.error);
        toast.error(result.error);
      } else {
        toast.success("Berhasil masuk");
        router.push(redirectTo.startsWith("/") ? redirectTo : "/dashboard");
      }
    });
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative ambient background rings */}
      <div className="absolute top-10 left-10 w-80 h-80 rounded-full border border-primary/10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full border border-primary/10 pointer-events-none" />
      <div className="absolute -top-32 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between z-10 mb-6">
        <Link href="/" className="flex items-center gap-3">
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={logoUrl} alt={`Logo ${schoolName}`} className="h-9 w-auto object-contain" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
              <span className="material-symbols-outlined text-[22px]">menu_book</span>
            </div>
          )}
          <div className="flex flex-col">
            <span className="text-base font-bold text-foreground tracking-tight leading-tight">
              {schoolName}
            </span>
            <span className="text-[10px] font-bold text-accent tracking-wider uppercase leading-tight">
              SISTEM TAHFIZH AL-QUR&apos;AN
            </span>
          </div>
        </Link>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted border border-border/80 transition-colors bg-card/60 backdrop-blur-sm"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* CENTER CARD CONTAINER */}
      <main className="w-full flex-1 flex items-center justify-center py-4 z-10">
        <Card className="w-full max-w-[440px] shadow-xl border-border bg-card rounded-2xl overflow-hidden relative">
          {/* Top Multi-Color Accent Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-sabqi to-accent" />

          <CardContent className="p-6 sm:p-8 flex flex-col items-center">
            {/* Center Logo Icon */}
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4 text-primary shadow-xs">
              <span className="material-symbols-outlined text-[28px]">menu_book</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight text-center">
              Masuk ke Tahfizh App
            </h1>
            <p className="text-xs text-muted-foreground mt-1 text-center mb-6">
              Portal Mutaba&apos;ah Asatidz, Santri, &amp; Wali Santri
            </p>

            {/* Error Alert Banner */}
            {errorMessage && (
              <div className="w-full flex items-start gap-3 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs mb-5">
                <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">error</span>
                <div className="flex-1">
                  <div className="font-bold">Gagal Masuk</div>
                  <div className="text-[11px] text-destructive/90 mt-0.5">
                    {errorMessage === "Email atau kata sandi salah"
                      ? "Email atau kata sandi yang Anda masukkan tidak sesuai. Silakan periksa kembali akun Anda."
                      : errorMessage}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-destructive/70 hover:text-destructive"
                  aria-label="Tutup pesan error"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            )}

            {/* LOGIN FORM */}
            <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-4">
              {/* EMAIL FIELD */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  EMAIL
                </label>
                <Controller
                  control={control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <div>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[18px]">
                          mail
                        </span>
                        <Input
                          type="email"
                          placeholder="musyrif.salman@darulilmi.sch.id"
                          className="pl-9 h-11 rounded-xl text-sm border-border bg-card focus-visible:ring-primary"
                          {...field}
                        />
                      </div>
                      {fieldState.error && (
                        <p className="text-xs text-destructive mt-1 font-medium">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* PASSWORD FIELD */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                    KATA SANDI
                  </label>
                  <a
                    href="#lupa-sandi"
                    className="text-xs text-primary font-medium hover:underline"
                  >
                    Lupa Kata Sandi?
                  </a>
                </div>
                <Controller
                  control={control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <div>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[18px]">
                          lock
                        </span>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••••••"
                          className="pl-9 pr-9 h-11 rounded-xl text-sm border-border bg-card focus-visible:ring-primary"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                      {fieldState.error && (
                        <p className="text-xs text-destructive mt-1 font-medium">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* REMEMBER ME CHECKBOX */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4 accent-primary"
                />
                <label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer select-none">
                  Ingat saya di perangkat ini
                </label>
              </div>

              {/* SUBMIT BUTTON */}
              <Button
                type="submit"
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 flex items-center justify-center gap-2 mt-2"
                disabled={isPending}
              >
                <span>{isPending ? "Memproses..." : "Masuk"}</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Button>
            </form>

            {/* ROLE PILLS DIVIDER */}
            <div className="w-full mt-6 pt-5 border-t border-border flex flex-col items-center">
              <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase mb-3">
                PERAN PENGGUNA
              </span>
              <div className="grid grid-cols-3 gap-2 w-full text-center">
                {/* Role 1 */}
                <div className="p-2 rounded-xl bg-sabaq-bg border border-sabaq-border/60 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sabaq" />
                    <span className="text-xs font-bold text-sabaq">Musyrif</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Pencatat Hafalan</span>
                </div>

                {/* Role 2 */}
                <div className="p-2 rounded-xl bg-sabqi-bg border border-sabqi-border/60 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sabqi" />
                    <span className="text-xs font-bold text-sabqi">Santri</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Target Mutaba&apos;ah</span>
                </div>

                {/* Role 3 */}
                <div className="p-2 rounded-xl bg-manzil-bg border border-manzil-border/60 flex flex-col items-center justify-center">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-manzil" />
                    <span className="text-xs font-bold text-manzil">Wali Santri</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Pantau Real-time</span>
                </div>
              </div>

              {/* Help Link */}
              <p className="text-xs text-muted-foreground mt-5 text-center">
                Belum terdaftar atau lupa akun?{" "}
                <a href="#hubungi-tu" className="text-primary font-semibold hover:underline">
                  Hubungi Tata Usaha
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* FOOTER */}
      <footer className="w-full max-w-7xl mx-auto flex flex-col items-center gap-3 z-10 pt-4">
        {/* Security Badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[16px]">lock</span>
            <span>Koneksi Terenkripsi SSL</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary text-[16px]">sync</span>
            <span>Sinkronisasi Otomatis</span>
          </div>
        </div>

        {/* Bottom copyright & links */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50 gap-2 text-center sm:text-left">
          <span>&copy; 2025 {schoolName}. Sistem Informasi Manajemen Mutaba&apos;ah Tahfizh.</span>
          <div className="flex items-center gap-4">
            <a href="#bantuan" className="hover:text-foreground transition-colors">Bantuan Teknis</a>
            <a href="#privasi" className="hover:text-foreground transition-colors">Kebijakan Privasi</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
