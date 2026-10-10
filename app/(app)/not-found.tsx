import Link from 'next/link';
import { FileSearch } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-8 py-16 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
        <FileSearch className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight text-foreground">
        Halaman Tidak Ditemukan
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Halaman yang Anda cari tidak ada atau telah dipindahkan.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
