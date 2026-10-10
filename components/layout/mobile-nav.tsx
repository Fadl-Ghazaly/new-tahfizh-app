'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  BookOpenCheck,
  BarChart3,
  MoreHorizontal,
  GraduationCap,
  Settings,
  X,
  LogOut,
} from 'lucide-react';
import { cn } from 'cn';
import { logoutAction } from '@/app/(app)/actions';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface MobileNavProps {
  role: string;
  userName: string;
  schoolName?: string;
}

const primaryNav = [
  { label: 'Beranda', href: '/dashboard', Icon: Home },
  { label: 'Santri', href: '/santri', Icon: Users },
  { label: 'Setoran', href: '/setoran', Icon: BookOpenCheck, fab: true },
  { label: 'Laporan', href: '/laporan', Icon: BarChart3 },
];

const moreNav = [
  { label: 'Data Ustadz', href: '/ustadz', Icon: GraduationCap },
  { label: 'Pengaturan', href: '/pengaturan', Icon: Settings, adminOnly: true },
];

export function MobileNav({ role, userName }: MobileNavProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Tutup drawer saat navigasi — gunakan ref untuk menghindari setState sync dalam effect
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setDrawerOpen(false);
    }
  }, [pathname]);

  const initials = userName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        aria-label="Navigasi bawah"
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/90 pb-safe backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.04)] md:hidden"
      >
        <div className="flex h-20 items-center justify-around px-2">
          {primaryNav.map(({ label, href, Icon, fab }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/');

            if (fab) {
              return (
                <Link
                  key={href}
                  href={href}
                  aria-label={label}
                  className="group flex -mt-6 flex-col items-center"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_16px_rgba(0,0,0,0.2)] transition-transform group-active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </div>
                  <span className="mt-1 text-[11px] font-medium text-muted-foreground">
                    {label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex min-w-14 flex-col items-center justify-center gap-1 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-6 w-6" aria-hidden="true" />
                <span className="text-[11px] font-medium">{label}</span>
              </Link>
            );
          })}

          {/* Tombol Lainnya */}
          <button
            type="button"
            aria-label="Buka menu lainnya"
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
            className={cn(
              'flex min-w-14 flex-col items-center justify-center gap-1 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl',
              drawerOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <MoreHorizontal className="h-6 w-6" aria-hidden="true" />
            <span className="text-[11px] font-medium">Lainnya</span>
          </button>
        </div>
      </nav>

      {/* Sheet Drawer — menu tambahan */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="bottom" showCloseButton={false} className="rounded-t-2xl p-0 md:hidden">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>

          <SheetHeader className="px-5 pb-2 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {initials}
                </div>
                <div className="flex flex-col">
                  <SheetTitle className="text-sm font-semibold leading-tight">
                    {userName}
                  </SheetTitle>
                  <span
                    className={cn(
                      'mt-0.5 w-fit rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      role === 'ADMIN'
                        ? 'bg-primary/15 text-primary'
                        : 'bg-accent/20 text-accent-foreground',
                    )}
                  >
                    {role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                aria-label="Tutup menu"
                onClick={() => setDrawerOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </SheetHeader>

          {/* Menu tambahan */}
          <nav className="flex flex-col gap-1 px-4 pb-4">
            {moreNav.map(({ label, href, Icon, adminOnly }) => {
              if (adminOnly && role !== 'ADMIN') return null;
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                    isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              );
            })}

            {/* Divider */}
            <div className="my-2 h-px bg-border" />

            {/* Logout */}
            <form action={logoutAction}>
              <button
                type="submit"
                aria-label="Keluar dari aplikasi"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
              >
                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </form>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
