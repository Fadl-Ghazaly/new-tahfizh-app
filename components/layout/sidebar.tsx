import Image from 'next/image';
import { NavLinks } from '@/components/layout/nav-links';

interface SidebarProps {
  role: string;
  schoolName: string;
  logoUrl?: string | null;
}

export function Sidebar({ role, schoolName, logoUrl }: SidebarProps) {
  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 hidden w-72 flex-col bg-sidebar text-primary-foreground shadow-[0_4px_24px_rgba(0,0,0,0.18)] md:flex"
      aria-label="Navigasi utama"
    >
      {/* Header Sidebar — logo + nama pesantren */}
      <div className="flex items-center gap-3 px-6 py-6">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt="Logo pesantren"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl object-contain"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/15 backdrop-blur-sm">
            <span className="material-symbols-outlined text-2xl text-primary-foreground" aria-hidden="true">
              menu_book
            </span>
          </div>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[18px] font-bold leading-tight tracking-tight text-primary-foreground">
            {schoolName}
          </span>
          <span className="truncate text-[11px] font-bold uppercase tracking-widest text-primary-foreground/60">
            Sistem Tahfizh Al-Qur&apos;an
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-6 h-px bg-primary-foreground/10" />

      {/* Menu navigasi */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
        <NavLinks role={role} variant="sidebar" />
      </nav>

    </aside>
  );
}
