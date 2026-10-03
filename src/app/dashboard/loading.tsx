import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-32" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>

        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-14 rounded-2xl" />

        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
