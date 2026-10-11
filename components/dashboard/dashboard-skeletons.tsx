export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl bg-slate-100 p-6 h-[140px] animate-pulse flex flex-col justify-between">
          <div className="flex justify-between items-center">
            <div className="h-3 bg-slate-200 rounded w-24"></div>
            <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
          </div>
          <div>
            <div className="h-8 bg-slate-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-slate-200 rounded w-40"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SectionSkeleton({ height = 350 }: { height?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 animate-pulse">
      <div className="h-5 bg-slate-200 rounded w-48 mb-2"></div>
      <div className="h-3 bg-slate-100 rounded w-64 mb-6"></div>
      <div style={{ height: `${height}px` }} className="bg-slate-50 rounded-xl w-full"></div>
    </div>
  );
}

export function TwoColSkeleton({ height = 350 }: { height?: number }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-48 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-64 mb-6"></div>
        <div style={{ height: `${height}px` }} className="bg-slate-50 rounded-xl w-full"></div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-48 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-64 mb-6"></div>
        <div style={{ height: `${height}px` }} className="bg-slate-50 rounded-xl w-full"></div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <StatCardsSkeleton />
      <TwoColSkeleton height={300} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <SectionSkeleton height={350} />
        </div>
        <div>
          <SectionSkeleton height={350} />
        </div>
      </div>
      <TwoColSkeleton height={300} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div>
          <SectionSkeleton height={300} />
        </div>
        <div className="xl:col-span-2">
          <SectionSkeleton height={300} />
        </div>
      </div>
    </div>
  );
}
