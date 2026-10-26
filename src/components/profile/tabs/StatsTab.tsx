import React from 'react'
import { StatsDashboard } from '../StatsDashboard'
import { AdvancedStats } from '../AdvancedStats'
import { SavedRankingsSection } from '../SavedRankingsSection'
import { UserStats } from '../../../hooks/useProfile'
import { Meetup } from '../../../types'

interface StatsTabProps {
  stats: UserStats;
  meetups: Meetup[];
  profileId: string;
  savedRankings: any[];
  loadingRankings: boolean;
  isOwnProfile: boolean;
  setSelectedRanking: (ranking: any) => void;
  handleDeleteRanking: (e: React.MouseEvent, rankingId: string) => void;
}

export function StatsTab({
  stats,
  meetups,
  profileId,
  savedRankings,
  loadingRankings,
  isOwnProfile,
  setSelectedRanking,
  handleDeleteRanking
}: StatsTabProps) {
  return (
    <div className="space-y-5 text-left">
      {/* 1. Glanceable Compact Stat Cards */}
      <StatsDashboard stats={stats} meetups={meetups} profileId={profileId} />

      {/* 2. Advanced Player Radar & Title */}
      <AdvancedStats stats={stats} meetups={meetups} profileId={profileId} />

      {/* 3. Saved Rankings & Tier Lists */}
      <SavedRankingsSection
        savedRankings={savedRankings}
        loadingRankings={loadingRankings}
        isOwnProfile={isOwnProfile}
        setSelectedRanking={setSelectedRanking}
        handleDeleteRanking={handleDeleteRanking}
      />
    </div>
  )
}
