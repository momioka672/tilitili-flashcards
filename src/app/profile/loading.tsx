import { Skeleton } from "@/components/ui/Skeleton";

export default function ProfileLoading() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <Skeleton className="h-6 w-32" />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col items-center gap-3">
          <Skeleton className="w-20 h-20 rounded-full" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-20" />
        </div>

        <Skeleton className="h-24 rounded-2xl" />

        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>

        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
