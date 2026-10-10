'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from 'cn';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpenCheck,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  Icon: LucideIcon;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', Icon: LayoutDashboard },
  { label: 'Data Santri', href: '/santri', Icon: Users },
  { label: 'Data Ustadz', href: '/ustadz', Icon: GraduationCap },
  { label: 'Input Setoran', href: '/setoran', Icon: BookOpenCheck },
  { label: 'Laporan', href: '/laporan', Icon: BarChart3 },
  { label: 'Pengaturan', href: '/pengaturan', Icon: Settings, adminOnly: true },
];

interface NavLinksProps {
  role: string;
  /** Jika true, gunakan gaya vertikal (sidebar); false untuk bottom nav */
  variant?: 'sidebar' | 'drawer';
  onNavigate?: () => void;
}

export function NavLinks({ role, variant = 'sidebar', onNavigate }: NavLinksProps) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map(({ label, href, Icon, adminOnly }) => {
        if (adminOnly && role !== 'ADMIN') return null;
        const isActive = pathname === href || pathname.startsWith(href + '/');

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? 'page' : undefined}
            onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isActive
                ? 'bg-card text-primary shadow-sm'
                : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground',
              variant === 'drawer' && 'text-foreground hover:bg-muted',
              variant === 'drawer' && isActive && 'bg-primary/10 text-primary',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </>
  );
}
