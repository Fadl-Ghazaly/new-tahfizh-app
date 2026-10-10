'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Client Component kecil yang menampilkan toast berdasarkan searchParams.
 * Dipakai di dashboard untuk menangkap redirect error=unauthorized dari /pengaturan.
 */
export function DashboardToast() {
  const searchParams = useSearchParams();
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current) return;
    const error = searchParams.get('error');
    if (error === 'unauthorized') {
      toast.error('Anda tidak memiliki akses ke halaman tersebut.');
      shown.current = true;
    }
  }, [searchParams]);

  return null;
}
