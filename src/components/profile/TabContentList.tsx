import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Meetup, Game } from '../../types'
import { UserStats } from '../../hooks/useProfile'
import { MeetupsTab } from './tabs/MeetupsTab'
import { CollectionTab } from './tabs/CollectionTab'
import { VitrinaTab } from './tabs/VitrinaTab'
import { StatsTab } from './tabs/StatsTab'

export type ProfileTabType = 'meetups' | 'collection' | 'vitrina' | 'stats' | 'upcoming' | 'completed' | 'mas'

interface TabContentListProps {
  activeTab: ProfileTabType;
  upcomingMeetups: Meetup[];
  completedMeetups: Meetup[];
  collectionGames: Game[];
  loadingCollection: boolean;
  savedRankings: any[];
  loadingRankings: boolean;
  isOwnProfile: boolean;
  isOwnProfileEditable: boolean;
  currentUserId: string | undefined;
  stats: UserStats;
  meetups: Meetup[];
  profileId: string;
  organizedCount?: number;
  handleRemoveFromCollection: (e: React.MouseEvent, bggId: number) => void;
  handleDeleteRanking: (e: React.MouseEvent, rankingId: string) => void;
  setSelectedRanking: (ranking: any) => void;
  setIsImportModalOpen: (val: boolean) => void;
  setIsAddGameModalOpen?: (val: boolean) => void;
}

export function TabContentList({
  activeTab,
  upcomingMeetups,
  completedMeetups,
  collectionGames,
  loadingCollection,
  savedRankings,
  loadingRankings,
  isOwnProfile,
  isOwnProfileEditable,
  currentUserId,
  stats,
  meetups,
  profileId,
  organizedCount = 0,
  handleRemoveFromCollection,
  handleDeleteRanking,
  setSelectedRanking,
  setIsImportModalOpen,
  setIsAddGameModalOpen
}: TabContentListProps) {
  const shouldReduceMotion = useReducedMotion()

  const panelMotionProps = {
    role: 'tabpanel',
    id: `tabpanel-${activeTab}`,
    'aria-labelledby': `tab-${activeTab}`,
    tabIndex: 0,
    className: 'focus-visible:outline-none',
    initial: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 },
    animate: shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 },
    exit: { opacity: 0, transition: { duration: 0.08 } },
    transition: { duration: 0.14, ease: [0.23, 1, 0.32, 1] as const },
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {activeTab === 'upcoming' && (
          <motion.div key="upcoming-tab" {...panelMotionProps}>
            <MeetupsTab
              meetups={upcomingMeetups}
              type="upcoming"
              isOwnProfile={isOwnProfile}
              currentUserId={currentUserId}
            />
          </motion.div>
        )}

        {activeTab === 'completed' && (
          <motion.div key="completed-tab" {...panelMotionProps}>
            <MeetupsTab
              meetups={completedMeetups}
              type="completed"
              isOwnProfile={isOwnProfile}
              currentUserId={currentUserId}
            />
          </motion.div>
        )}

        {activeTab === 'collection' && (
          <motion.div key="collection-tab" {...panelMotionProps}>
            <CollectionTab
              collectionGames={collectionGames}
              loadingCollection={loadingCollection}
              isOwnProfileEditable={isOwnProfileEditable}
              meetups={meetups}
              profileId={profileId}
              handleRemoveFromCollection={handleRemoveFromCollection}
              setIsImportModalOpen={setIsImportModalOpen}
              setIsAddGameModalOpen={setIsAddGameModalOpen}
            />
          </motion.div>
        )}

        {activeTab === 'vitrina' && (
          <motion.div key="vitrina-tab" {...panelMotionProps}>
            <VitrinaTab
              organizedCount={organizedCount}
              stats={stats}
              savedRankingsCount={savedRankings.length}
              savedRankings={savedRankings}
              loadingRankings={loadingRankings}
              isOwnProfile={isOwnProfile}
              setSelectedRanking={setSelectedRanking}
              handleDeleteRanking={handleDeleteRanking}
            />
          </motion.div>
        )}

        {(activeTab === 'stats' || activeTab === 'mas') && (
          <motion.div key="stats-tab" {...panelMotionProps}>
            <StatsTab
              stats={stats}
              meetups={meetups}
              profileId={profileId}
              savedRankings={savedRankings}
              loadingRankings={loadingRankings}
              isOwnProfile={isOwnProfile}
              setSelectedRanking={setSelectedRanking}
              handleDeleteRanking={handleDeleteRanking}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
