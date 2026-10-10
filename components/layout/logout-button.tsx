'use client';

import { logoutAction } from '@/app/(app)/actions';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label="Keluar dari aplikasi"
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span>Keluar</span>
      </button>
    </form>
  );
}
