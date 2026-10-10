import { Landmark } from 'lucide-react';
import { LogoutButton } from '@/components/layout/logout-button';

interface TopbarProps {
  userName: string;
  role: string;
  schoolName: string;
}

export function Topbar({ userName, role, schoolName }: TopbarProps) {
  /** Ambil inisial nama untuk avatar */
  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/90 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md md:left-72 md:px-6">
      {/* Kiri — nama pesantren */}
      <div className="flex items-center gap-2 min-w-0">
        <Landmark className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <span className="hidden truncate text-base font-semibold text-foreground sm:block">
          {schoolName} — Portal Administrasi &amp; Mutaba&apos;ah
        </span>
        <span className="block truncate text-base font-semibold text-foreground sm:hidden">
          {schoolName}
        </span>
      </div>

      {/* Kanan — avatar, badge role, logout */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Info pengguna */}
        <div className="flex items-center gap-2">
          {/* Avatar */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
            aria-hidden="true"
          >
            {initials}
          </div>

          {/* Nama + badge role (desktop) */}
          <div className="hidden flex-col sm:flex">
            <span className="text-[13px] font-semibold leading-tight text-foreground">
              {userName}
            </span>
            <span
              className={`mt-0.5 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                role === 'ADMIN'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-accent/20 text-accent-foreground'
              }`}
            >
              {role}
            </span>
          </div>
        </div>

        {/* Tombol logout */}
        <LogoutButton />
      </div>
    </header>
  );
}
