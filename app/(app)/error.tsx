'use client';

import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Terjadi Kesalahan</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Halaman ini tidak dapat dimuat. Silakan coba lagi, atau hubungi administrator jika
        masalah berlanjut.
      </p>
      {error.digest && (
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Kode: {error.digest}
        </p>
      )}
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
      >
        Coba Lagi
      </button>
    </div>
  );
}
