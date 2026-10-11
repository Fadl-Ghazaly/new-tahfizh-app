import { getPublicSchoolSettings } from "@/lib/settings";
import Link from "next/link";



export default async function LandingPage() {
  const { school_name: schoolName, logo_url: logoUrl } = await getPublicSchoolSettings();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* HEADER / NAVIGATION */}
      <header className="fixed top-0 w-full z-50 bg-card/85 backdrop-blur-xl border-b border-border shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 sm:h-20 max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 min-w-0">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={logoUrl} alt={`Logo ${schoolName}`} className="h-7 sm:h-8 w-auto object-contain shrink-0" />
            ) : (
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg font-bold text-primary tracking-tight leading-tight truncate">
                {schoolName}
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-accent tracking-wide uppercase leading-tight">
                Sistem Tahfizh
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="transition-colors text-primary font-bold text-sm">
              Beranda
            </Link>
            <Link href="#metode" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Metode Tahfizh
            </Link>
            <Link href="#fitur" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Fitur
            </Link>
            <Link href="#tentang" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Tentang Pesantren
            </Link>
            <Link href="#kontak" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Kontak
            </Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a
              href="#daftar"
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-primary hover:bg-muted transition-colors"
            >
              Daftar Santri
            </a>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-3.5 py-1.5 sm:px-4 sm:py-2 bg-primary text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm"
            >
              Masuk
            </Link>
            <div className="w-8 h-8 rounded-full bg-primary hidden sm:flex items-center justify-center text-primary-foreground ml-1">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="w-full pt-20 flex-1">
        {/* HERO SECTION */}
        <section className="relative w-full overflow-hidden px-5 sm:px-8 py-14 md:py-20 flex flex-col items-center text-center">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[360px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          {/* Centered Badge */}
          <div className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-muted border border-border shadow-sm mb-6">
            <span className="material-symbols-outlined text-primary text-[18px]">auto_awesome</span>
            <span className="text-xs font-semibold text-primary tracking-wide">
              Sistem Manajemen &amp; Mutaba&apos;ah Digital
            </span>
          </div>

          {/* Prominent Logo with Ambient Glow */}
          <div className="relative mb-4 flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-110 pointer-events-none" />
            <div className="relative w-[100px] h-[100px] p-2 bg-card border border-border rounded-2xl shadow-md flex items-center justify-center">
              {logoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logoUrl} alt={`Logo ${schoolName}`} className="w-full h-full object-contain" />
              ) : (
                <span className="material-symbols-outlined text-primary text-[48px]">menu_book</span>
              )}
            </div>
          </div>

          {/* Main Headline & Tagline */}
          <div className="max-w-4xl mx-auto flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest text-primary font-bold mb-2">
              {schoolName}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground max-w-3xl leading-tight">
              Pencatatan Tahfidz Santri dengan Metode Sabaq, Sabqi, dan Manzil
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mt-4 leading-relaxed">
              Platform terpadu untuk para asatidz, santri, dan wali santri dalam memantau kualitas dan kelancaran hafalan Al-Qur&apos;an secara terstruktur dan istiqomah.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
            >
              <span>Masuk</span>
              <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
            </Link>
            <a
              href="#metode"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-card border border-border text-primary font-semibold text-sm shadow-sm hover:bg-muted transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
              <span>Pelajari Metode</span>
            </a>
          </div>

          {/* Stats Summary Pill Row */}
          <div className="w-full max-w-5xl mx-auto mt-14 pt-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[22px]">groups</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground">500+</span>
                  <span className="text-xs text-muted-foreground">Santri Penghafal</span>
                </div>
              </div>
              {/* Stat 2 */}
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm text-left">
                <div className="w-10 h-10 rounded-xl bg-sabqi-bg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-sabqi text-[22px]">auto_stories</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground">30 Juz</span>
                  <span className="text-xs text-muted-foreground">Terpantau</span>
                </div>
              </div>
              {/* Stat 3 */}
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm text-left">
                <div className="w-10 h-10 rounded-xl bg-manzil-bg flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-manzil text-[22px]">verified</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground">98%</span>
                  <span className="text-xs text-muted-foreground">Mutqin &amp; Istiqomah</span>
                </div>
              </div>
              {/* Stat 4 */}
              <div className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl shadow-sm text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[22px]">monitoring</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-bold text-foreground">Real-Time</span>
                  <span className="text-xs text-muted-foreground">Laporan Wali Santri</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THREE FEATURE CARDS SECTION (METODE TAHFIZH) */}
        <section className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-16" id="metode">
          {/* Section Header */}
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-muted border border-border mb-3 shadow-sm">
              <span className="material-symbols-outlined text-primary text-[16px]">school</span>
              <span className="text-xs font-bold text-primary uppercase tracking-wide">
                Kurikulum &amp; Pendekatan
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground">
              3 Pilar Metode Menjaga Hafalan
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              Metode klasik yang terbukti melahirkan huffadz mutqin, kini dipadukan dengan kemudahan pencatatan digital harian.
            </p>
          </div>

          {/* Grid of 3 Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {/* CARD 1: SABAQ */}
            <div className="flex flex-col justify-between p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div>
                {/* Top Tag & Icon Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sabaq-bg text-sabaq border border-sabaq-border text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">bookmark</span>
                    Sabaq • Hafalan Baru
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-sabaq-bg text-sabaq flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">menu_book</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground">Sabaq</h3>
                <p className="text-xs font-semibold text-primary mb-2">Hafalan Baru Harian</p>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Setoran ayat atau halaman baru yang dihafal santri setiap hari di hadapan musyrif dengan kaidah tajwid yang benar.
                </p>

                {/* Key Metrics */}
                <div className="flex flex-col gap-2 p-3.5 bg-muted rounded-xl mb-4 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">flag</span>
                    <div className="text-foreground">
                      <span className="font-semibold text-primary">Target:</span> 1/2 hingga 1 Halaman / hari
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">schedule</span>
                    <div className="text-foreground">
                      <span className="font-semibold text-primary">Waktu:</span> Ba&apos;da Subuh &amp; Ba&apos;da Ashar
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">check_circle</span>
                    <div className="text-foreground">
                      <span className="font-semibold text-primary">Evaluasi:</span> Kelancaran makhorijul huruf &amp; ayat
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge Preview */}
              <div className="pt-2">
                <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sabaq-bg text-sabaq text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">task_alt</span>
                  <span>Target Harian Tercapai</span>
                </div>
              </div>
            </div>

            {/* CARD 2: SABQI */}
            <div className="flex flex-col justify-between p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div>
                {/* Top Tag & Icon Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sabqi-bg text-sabqi border border-sabqi-border text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">sync</span>
                    Sabqi • Murojaah Dekat
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-sabqi-bg text-sabqi flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">update</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground">Sabqi</h3>
                <p className="text-xs font-semibold text-sabqi mb-2">Murojaah Hafalan Terkini</p>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Pengulangan hafalan yang baru didapat dalam beberapa hari atau juz terakhir untuk memperkuat sambungan hafalan baru ke memori jangka panjang.
                </p>

                {/* Key Metrics */}
                <div className="flex flex-col gap-2 p-3.5 bg-muted rounded-xl mb-4 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sabqi text-[16px] shrink-0 mt-0.5">folder_open</span>
                    <div className="text-foreground">
                      <span className="font-semibold text-sabqi">Rentang:</span> 1–5 Juz terakhir
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sabqi text-[16px] shrink-0 mt-0.5">schedule</span>
                    <div className="text-foreground">
                      <span className="font-semibold text-sabqi">Waktu:</span> Ba&apos;da Maghrib &amp; Isya
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-sabqi text-[16px] shrink-0 mt-0.5">psychology</span>
                    <div className="text-foreground">
                      <span className="font-semibold text-sabqi">Evaluasi:</span> Sambung ayat spontan &amp; tanpa jeda
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge Preview */}
              <div className="pt-2">
                <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sabqi-bg text-sabqi text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Kelancaran Terjaga (Mutqin)</span>
                </div>
              </div>
            </div>

            {/* CARD 3: MANZIL */}
            <div className="flex flex-col justify-between p-6 bg-card border border-border rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
              <div>
                {/* Top Tag & Icon Row */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-manzil-bg text-manzil border border-manzil-border text-xs font-bold">
                    <span className="material-symbols-outlined text-[14px]">shield</span>
                    Manzil • Murojaah Lama
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-manzil-bg text-manzil flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-foreground">Manzil</h3>
                <p className="text-xs font-semibold text-manzil mb-2">Murojaah Hafalan Lama Keseluruhan</p>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Pengulangan seluruh juz yang telah diselesaikan secara terjadwal dan berkala agar hafalan lama tidak terlupakan sepanjang masa.
                </p>

                {/* Key Metrics */}
                <div className="flex flex-col gap-2 p-3.5 bg-muted rounded-xl mb-4 text-xs">
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-manzil text-[16px] shrink-0 mt-0.5">change_circle</span>
                    <div className="text-foreground">
                      <span className="font-semibold text-manzil">Putaran:</span> 1 Juz per hari (Khatam berkala)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-manzil text-[16px] shrink-0 mt-0.5">schedule</span>
                    <div className="text-foreground">
                      <span className="font-semibold text-manzil">Waktu:</span> Halaqah Pagi / Mandiri
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-manzil text-[16px] shrink-0 mt-0.5">military_tech</span>
                    <div className="text-foreground">
                      <span className="font-semibold text-manzil">Evaluasi:</span> Ujian kenaikan juz &amp; tasmi&apos; akbar
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Badge Preview */}
              <div className="pt-2">
                <div className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-manzil-bg text-manzil text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">stars</span>
                  <span>Siklus Terjadwal 30 Juz</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BANNER PREVIEW / INTERACTIVE SIMULATION */}
        <section className="w-full max-w-7xl mx-auto px-5 sm:px-8 py-12" id="fitur">
          <div className="relative bg-card border border-border rounded-2xl shadow-xl overflow-hidden p-6 sm:p-8 lg:p-12">
            {/* Ambient Glow */}
            <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left: Mockup UI Card */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary w-fit mb-3 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[16px]">badge</span>
                  <span>Contoh Catatan Harian Santri</span>
                </div>

                <div className="bg-muted/70 border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
                  {/* Santri Profile */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-base shadow-sm">
                        MF
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-foreground">Muhammad Fatih</h4>
                        <p className="text-xs text-muted-foreground">Kelas 2 Tahfizh • Halaqah Ustadz Salman Al-Farisi</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-sabaq-bg text-sabaq text-[11px] font-bold">
                      Aktif Hari Ini
                    </span>
                  </div>

                  {/* Setoran Records List */}
                  <div className="flex flex-col gap-2.5">
                    {/* Sabaq Item */}
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-xs">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-sabaq-bg text-sabaq text-[11px] font-bold">
                          Sabaq
                        </span>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-foreground">Surah Al-Kahf : Ayat 1-10</div>
                          <div className="text-[11px] text-muted-foreground">Hafalan Baru • Ba&apos;da Subuh</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sabaq-bg text-sabaq text-xs font-semibold">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Lancar (Mumtaz)</span>
                      </div>
                    </div>

                    {/* Sabqi Item */}
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-xs">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-sabqi-bg text-sabqi text-[11px] font-bold">
                          Sabqi
                        </span>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-foreground">Juz 14 (Surah Al-Hijr &amp; An-Nahl)</div>
                          <div className="text-[11px] text-muted-foreground">Murojaah Terkini • Ba&apos;da Maghrib</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sabqi-bg text-sabqi text-xs font-semibold">
                        <span className="material-symbols-outlined text-[16px]">verified</span>
                        <span>Mutqin</span>
                      </div>
                    </div>

                    {/* Manzil Item */}
                    <div className="flex items-center justify-between p-3 bg-card border border-border rounded-xl shadow-xs">
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-manzil-bg text-manzil text-[11px] font-bold">
                          Manzil
                        </span>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-foreground">Juz 3 (Surah Ali &apos;Imran)</div>
                          <div className="text-[11px] text-muted-foreground">Murojaah Siklus • Halaqah Pagi</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-manzil-bg text-manzil text-xs font-semibold">
                        <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                        <span>Baik (Jayyid)</span>
                      </div>
                    </div>
                  </div>

                  {/* Total Indicator */}
                  <div className="mt-3 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-muted-foreground gap-1 border-t border-border/40">
                    <span>Progres Mushaf: <strong className="text-foreground font-semibold">14 / 30 Juz</strong></span>
                    <span className="text-primary font-semibold">Tercatat oleh Ustaz Salman, Lc.</span>
                  </div>
                </div>
              </div>

              {/* Right: CTA Callout */}
              <div className="lg:col-span-5 flex flex-col lg:pl-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent flex items-center justify-center mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-[28px]">insights</span>
                </div>
                <h3 className="text-2xl font-bold text-foreground">Mulai Pencatatan Santri Sekarang</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-6 leading-relaxed">
                  Pantau setiap ayat, perkuat hafalan dengan metode teruji, dan hadirkan transparansi mutaba&apos;ah langsung ke genggaman wali santri dan asatidz.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02]"
                  >
                    <span>Masuk ke Sistem</span>
                    <span className="material-symbols-outlined text-[18px]">login</span>
                  </Link>
                  <a
                    href="#daftar"
                    className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-muted border border-border text-primary font-semibold text-sm hover:bg-muted/80 transition-colors"
                  >
                    <span>Daftar Santri Baru</span>
                  </a>
                </div>

                {/* Bullets */}
                <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                    <span>Integrasi 3 Metode</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                    <span>Notifikasi WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                    <span>Raport Tahfizh Digital</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                    <span>Riwayat Setoran Rapi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-card border-t border-border mt-12 py-12" id="tentang">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-10">
            {/* Col 1 */}
            <div className="md:col-span-5 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoUrl} alt={`Logo ${schoolName}`} className="h-8 w-auto object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[20px]">menu_book</span>
                  </div>
                )}
                <span className="text-lg font-bold text-primary">{schoolName}</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                Mencetak generasi penghafal Al-Qur&apos;an yang mutqin, berakhlak mulia, dan berwawasan global melalui integrasi metode Sabaq, Sabqi, dan Manzil secara terstruktur.
              </p>
              <div className="flex items-center gap-2 text-muted-foreground text-xs mt-2" id="kontak">
                <span className="material-symbols-outlined text-primary text-[18px]">location_on</span>
                <span>Jl. Darul Ilmi No. 45, Cileungsi, Jawa Barat</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span className="material-symbols-outlined text-primary text-[18px]">call</span>
                <span>+62 812-3456-7890</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground text-xs">
                <span className="material-symbols-outlined text-primary text-[18px]">mail</span>
                <span>tahfizh@darulilmi.sch.id</span>
              </div>
            </div>

            {/* Col 2 */}
            <div className="md:col-span-3 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-foreground">Metode &amp; Kurikulum</h4>
              <nav className="flex flex-col gap-2 text-xs text-muted-foreground">
                <a href="#metode" className="hover:text-foreground transition-colors">Sabaq (Hafalan Baru)</a>
                <a href="#metode" className="hover:text-foreground transition-colors">Sabqi (Murojaah Dekat)</a>
                <a href="#metode" className="hover:text-foreground transition-colors">Manzil (Murojaah Lama)</a>
                <a href="#metode" className="hover:text-foreground transition-colors">Ujian Tasmik &amp; Mutqin</a>
              </nav>
            </div>

            {/* Col 3 */}
            <div className="md:col-span-4 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-foreground">Navigasi Cepat</h4>
              <nav className="flex flex-col gap-2 text-xs text-muted-foreground">
                <Link href="/login" className="hover:text-foreground transition-colors">Portal Halaqah Ustaz</Link>
                <Link href="/login" className="hover:text-foreground transition-colors">Pantauan Wali Santri</Link>
                <a href="#fitur" className="hover:text-foreground transition-colors">Kalender Tahfizh Semester</a>
                <a href="#tentang" className="hover:text-foreground transition-colors">Pusat Bantuan &amp; Panduan</a>
              </nav>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-border text-xs text-muted-foreground gap-3">
            <span>&copy; 2025 {schoolName}. Seluruh hak cipta dilindungi undang-undang.</span>
            <div className="flex items-center gap-6">
              <a href="#privasi" className="hover:text-foreground transition-colors">Kebijakan Privasi</a>
              <a href="#syarat" className="hover:text-foreground transition-colors">Syarat &amp; Ketentuan</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
