import { FC } from 'react'
import { Skeleton } from '../ui/skeleton'

export const GroupDetailSkeleton: FC = () => {
  return (
    <section className="space-y-6 pb-24 max-w-6xl mx-auto px-4 sm:px-0" aria-busy="true" aria-label="Cargando detalles del grupo">
      {/* 1. Top action bar skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-28 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>

      {/* 2. Tactical War Room Masthead / Header Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-card/50 border border-border/45 p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0" />
            <div className="space-y-2.5 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Skeleton className="h-7 sm:h-8 w-48 rounded-lg" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-72 max-w-full rounded-md" />
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Skeleton className="h-10 w-28 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 3. Stats Pills Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl border border-border/30 bg-card/40 space-y-2">
            <Skeleton className="h-3.5 w-16 rounded-md" />
            <Skeleton className="h-7 w-12 rounded-lg" />
          </div>
        ))}
      </div>

      {/* 4. Tabs Bar Skeleton */}
      <div className="flex gap-2 border-b border-border/30 pb-2 overflow-x-auto">
        <Skeleton className="h-10 w-32 rounded-xl shrink-0" />
        <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
        <Skeleton className="h-10 w-40 rounded-xl shrink-0" />
        <Skeleton className="h-10 w-28 rounded-xl shrink-0" />
      </div>

      {/* 5. Three Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-5 rounded-3xl border border-border/40 bg-card/40 space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="space-y-1.5 flex-1 min-w-0">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-14 w-full rounded-xl" />
            <div className="pt-2 border-t border-border/20 flex justify-between items-center">
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
