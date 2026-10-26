import React from 'react'
import { AchievementsVitrina } from '../AchievementsVitrina'
import { SavedRankingsSection } from '../SavedRankingsSection'
import { UserStats } from '../../../hooks/useProfile'

interface VitrinaTabProps {
  organizedCount: number;
  stats: UserStats;
  savedRankingsCount: number;
  savedRankings: any[];
  loadingRankings: boolean;
  isOwnProfile: boolean;
  setSelectedRanking: (ranking: any) => void;
  handleDeleteRanking: (e: React.MouseEvent, rankingId: string) => void;
}

export function VitrinaTab({
  organizedCount,
  stats,
  savedRankingsCount,
  savedRankings,
  loadingRankings,
  isOwnProfile,
  setSelectedRanking,
  handleDeleteRanking,
}: VitrinaTabProps) {
  return (
    <div className="space-y-6">
      {/* 1. Saved Rankings & Tier Lists Showcase */}
      <SavedRankingsSection
        savedRankings={savedRankings}
        loadingRankings={loadingRankings}
        isOwnProfile={isOwnProfile}
        setSelectedRanking={setSelectedRanking}
        handleDeleteRanking={handleDeleteRanking}
      />

      {/* 2. Achievements and Badges */}
      <AchievementsVitrina
        organizedCount={organizedCount}
        stats={stats}
        savedRankingsCount={savedRankingsCount}
      />
    </div>
  )
}
