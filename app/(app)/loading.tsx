export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Skeleton PageHeader */}
      <div className="flex flex-col gap-2">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-lg bg-muted" />
      </div>

      {/* Skeleton konten */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>

      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}
