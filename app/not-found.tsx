import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function GlobalNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-dashed border-border bg-card p-8 shadow-sm">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Compass className="h-8 w-8 text-primary" aria-hidden="true" />
        </div>
        <span className="text-sm font-bold uppercase tracking-wider text-primary">
          Galat 404
        </span>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Maaf, halaman yang Anda tuju tidak ditemukan atau alamat URL yang Anda masukkan salah.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-95"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
