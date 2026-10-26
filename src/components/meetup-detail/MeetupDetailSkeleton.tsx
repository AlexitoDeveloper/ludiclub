import { FC } from 'react'
import { Skeleton } from '../ui/skeleton'

export const MeetupDetailSkeleton: FC = () => {
  return (
    <section className="space-y-6 max-w-4xl mx-auto p-0 pb-28 md:p-4 md:pb-32 lg:pb-12" aria-busy="true" aria-label="Cargando detalles de la mesa">
      {/* 1. Top back bar + action buttons */}
      <div className="flex items-center justify-between pt-2 pb-3 px-4 md:px-0">
        <Skeleton className="h-9 w-24 rounded-xl" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 sm:w-28 rounded-xl" />
          <Skeleton className="h-9 w-9 sm:w-32 rounded-xl" />
          <Skeleton className="h-9 w-9 sm:w-24 rounded-xl" />
        </div>
      </div>

      {/* 2. Hero Game Card Skeleton */}
      <div className="p-6 md:p-8 rounded-3xl border border-border/40 bg-card/40 backdrop-blur-md shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <Skeleton className="w-28 h-36 sm:w-36 sm:h-48 rounded-2xl shrink-0" />
          <div className="space-y-3 flex-1 w-full">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-8 sm:h-10 w-4/5 rounded-xl" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
            <div className="flex flex-wrap gap-2 pt-2">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Responsive Grid Layout (2 cols + 1 col sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns - Details, Attendees, Logistics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Skeleton */}
          <div className="p-6 rounded-3xl border border-border/40 bg-card/40 space-y-3">
            <Skeleton className="h-5 w-36 rounded-md" />
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-2/3 rounded-md" />
          </div>

          {/* Attendees List Grid Skeleton */}
          <div className="p-6 rounded-3xl border border-border/40 bg-card/40 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 rounded-2xl border border-border/30 bg-muted/20 flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <Skeleton className="h-3.5 w-16 rounded-md" />
                    <Skeleton className="h-2.5 w-10 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location / Logistics Skeleton */}
          <div className="p-6 rounded-3xl border border-border/40 bg-card/40 space-y-3">
            <Skeleton className="h-5 w-32 rounded-md" />
            <Skeleton className="h-4 w-3/4 rounded-md" />
          </div>
        </div>

        {/* Right Column - Action Sidebar Skeleton */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-border/40 bg-card/40 space-y-5">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32 rounded-md" />
              <Skeleton className="h-4 w-48 rounded-md" />
            </div>
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/30 space-y-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-6 w-36 rounded-md" />
            </div>
            <Skeleton className="h-12 w-full rounded-2xl" />
            <div className="pt-2 border-t border-border/30 flex justify-between items-center">
              <Skeleton className="h-4 w-20 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
