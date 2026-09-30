import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { Button } from '../components/ui/button'
import { Tabs } from '../components/ui/tabs'
import { useProfile } from '../hooks/useProfile'
import { useGamerLevel } from '../hooks/useGamerLevel'
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton'
import { ProfileHeader } from '../components/profile/ProfileHeader'
import { ProfileShowcaseCard } from '../components/profile/ProfileShowcaseCard'
import { TabContentList, ProfileTabType } from '../components/profile/TabContentList'
import { ProfileModals } from '../components/profile/ProfileModals'
import { BlockedProfileCard } from '../components/profile/BlockedProfileCard'
import { useBlockedUsers } from '../hooks/useBlockedUsers'
import { ArrowLeft, UserX, Dices, CalendarDays, Award, BarChart2, History } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from '../components/ui/toast'

export function ProfilePage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rankingIdParam = searchParams.get('ranking')

  const { isBlocked, unblockUser, refetch: refetchBlocked } = useBlockedUsers()

  const profileId = id || user?.id || ''

  const {
    profile,
    setProfile,
    meetups,
    stats,
    loading,
    errorMsg,
    savedRankings,
    loadingRankings,
    collectionGames,
    loadingCollection,
    savingProfile,
    saveProfile,
    importBggCollection,
    addToCollection,
    removeFromCollection,
    deleteRanking,
  } = useProfile({ profileId, currentUserId: user?.id })

  const targetUserId = profile?.id || profileId
  const isOwnProfile = Boolean(
    user && (
      !id ||
      id === user.id ||
      (profile && profile.id === user.id) ||
      (profile?.username && user.user_metadata?.username && profile.username.toLowerCase() === user.user_metadata.username.toLowerCase())
    )
  )
  const isOwnProfileEditable = isOwnProfile || (Boolean(profileId) && profileId.startsWith('mock-') && !id)

  const [isEditing, setIsEditing] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isAddGameModalOpen, setIsAddGameModalOpen] = useState(false)
  const [selectedRanking, setSelectedRanking] = useState<any | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<ProfileTabType>('upcoming')

  useEffect(() => {
    if (rankingIdParam && savedRankings.length > 0) {
      const found = savedRankings.find((r) => r.id === rankingIdParam)
      if (found) setSelectedRanking(found)
    }
  }, [rankingIdParam, savedRankings])

  const upcomingMeetups = useMemo(() => {
    return (meetups || [])
      .filter((m) => !m.completed && new Date(m.date).getTime() >= Date.now())
      .sort((a, b) => new Date(a.date || (a as any).created_at || 0).getTime() - new Date(b.date || (b as any).created_at || 0).getTime())
  }, [meetups])

  const completedMeetups = useMemo(() => {
    return (meetups || [])
      .filter((m) => m.completed || new Date(m.date).getTime() < Date.now())
      .sort((a, b) => new Date(b.date || (b as any).created_at || 0).getTime() - new Date(a.date || (a as any).created_at || 0).getTime())
  }, [meetups])

  const organizedCount = useMemo(() => {
    return (meetups || []).filter((m) => m.creator_id === targetUserId).length
  }, [meetups, targetUserId])

  const gamerLevel = useGamerLevel(stats, organizedCount, savedRankings.length)

  if (loading) return <ProfileSkeleton />

  if (errorMsg || !profile) {
    return (
      <section className="space-y-4 max-w-xl mx-auto p-4 text-center">
        <div className="text-destructive bg-destructive/10 px-4 py-6 rounded-2xl border border-destructive/20 space-y-3">
          <UserX className="w-10 h-10 mx-auto text-destructive" />
          <h2 className="text-xl font-bold">{t('profile.notAvailableTitle')}</h2>
          <p className="text-sm font-medium text-foreground/80">{errorMsg || t('profile.notAvailableDesc')}</p>
        </div>
        <Button
          onClick={() => navigate('/')}
          variant="outline"
          size="sm"
          icon={ArrowLeft}
          label={t('profile.backToHome')}
          className="mx-auto cursor-pointer"
        />
      </section>
    )
  }

  const isBlockedByViewer = !isOwnProfile && isBlocked(targetUserId)

  return (
    <section className="space-y-6 max-w-xl mx-auto p-0 pb-6 md:p-4 md:pb-24 relative">
      <ProfileHeader
        isOwnProfile={isOwnProfile}
        isOwnProfileEditable={isOwnProfileEditable}
        onEditClick={() => setIsEditing(true)}
        onSettingsClick={() => setIsSettingsOpen(true)}
        targetUserId={targetUserId}
        currentUserId={user?.id}
        username={profile?.username}
        isBlockedByViewer={isBlockedByViewer}
        onBlockStatusChange={() => refetchBlocked()}
      />

      {isBlockedByViewer ? (
        <BlockedProfileCard
          profile={profile}
          onUnblock={async () => {
            await unblockUser(targetUserId)
            refetchBlocked()
          }}
        />
      ) : (
        <>
          <ProfileShowcaseCard
            profile={profile}
            isOwnProfileEditable={isOwnProfileEditable}
            setProfile={setProfile}
            onEditClick={() => setIsEditing(true)}
            {...gamerLevel}
          />

          <Tabs<ProfileTabType>
            options={[
              { id: 'upcoming', label: t('profile.tabs.upcoming', 'Próximas'), icon: CalendarDays, count: upcomingMeetups.length },
              { id: 'completed', label: t('profile.tabs.completed', 'Historial'), icon: History, count: completedMeetups.length },
              { id: 'collection', label: t('profile.tabs.collection', 'Ludoteca'), icon: Dices, count: collectionGames.length },
              { id: 'vitrina', label: t('profile.tabs.vitrina', 'Vitrina'), icon: Award },
              { id: 'stats', label: t('profile.tabs.stats', 'Estadísticas'), icon: BarChart2 },
            ]}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab)}
            scrollable
          />

          <TabContentList
            activeTab={activeTab}
            upcomingMeetups={upcomingMeetups}
            completedMeetups={completedMeetups}
            collectionGames={collectionGames}
            loadingCollection={loadingCollection}
            savedRankings={savedRankings}
            loadingRankings={loadingRankings}
            isOwnProfile={isOwnProfile}
            isOwnProfileEditable={isOwnProfileEditable}
            currentUserId={user?.id}
            stats={stats}
            meetups={meetups}
            profileId={targetUserId}
            organizedCount={organizedCount}
            handleRemoveFromCollection={async (e, bggId) => {
              e.preventDefault()
              e.stopPropagation()
              await removeFromCollection(bggId)
              toast.info(t('toast.gameRemovedFromCollection', 'Juego eliminado de tu ludoteca.'))
            }}
            handleDeleteRanking={async (e, rankingId) => {
              e.preventDefault()
              e.stopPropagation()
              await deleteRanking(rankingId)
              toast.info(t('common.deleted', 'Eliminado'))
            }}
            setSelectedRanking={setSelectedRanking}
            setIsImportModalOpen={setIsImportModalOpen}
            setIsAddGameModalOpen={setIsAddGameModalOpen}
          />
        </>
      )}

      <ProfileModals
        isEditing={isEditing}
        setIsEditing={setIsEditing}
        profile={profile}
        profileId={targetUserId}
        currentUserId={user?.id}
        saveProfile={saveProfile}
        savingProfile={savingProfile}
        isImportModalOpen={isImportModalOpen}
        setIsImportModalOpen={setIsImportModalOpen}
        importBggCollection={importBggCollection}
        isAddGameModalOpen={isAddGameModalOpen}
        setIsAddGameModalOpen={setIsAddGameModalOpen}
        collectionGames={collectionGames}
        addToCollection={addToCollection}
        selectedRanking={selectedRanking}
        setSelectedRanking={setSelectedRanking}
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
      />
    </section>
  )
}

export default ProfilePage
