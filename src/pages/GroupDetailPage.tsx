import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Dices, Calendar, Trophy, Layers, Award, Users } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Tabs } from '../components/ui/tabs'
import { useGroupHub } from '../hooks/useGroupHub'
import { useAuth } from '../lib/authContext'
import { useTranslation } from 'react-i18next'
import { GroupDetailTabs } from '../components/group-detail/GroupDetailTabs'
import { GroupInviteQrModal } from '../components/groups/GroupInviteQrModal'
import { AddGameToLibraryModal } from '../components/library/AddGameToLibraryModal'
import { QuickLogMatchModal } from '../components/session/QuickLogMatchModal'
import { GroupConfirmDialog } from '../components/group-detail/GroupConfirmDialog'
import { GroupDetailHeader } from '../components/group-detail/GroupDetailHeader'
import { GroupDetailTabId } from '../components/group-detail/GroupDetailSegmentedNav'
import { GroupDetailInviteDrawer } from '../components/group-detail/GroupDetailInviteDrawer'
import { GroupDetailSkeleton } from '../components/group-detail/GroupDetailSkeleton'

export function GroupDetailPage() {
  const { id: groupId } = useParams<{ id: string }>()
  const { t } = useTranslation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<GroupDetailTabId>('meetups')
  const [collectionSearch, setCollectionSearch] = useState('')
  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = useState(false)

  const hub = useGroupHub(groupId)

  const filteredMerged = useMemo(() => {
    return hub.mergedCollection.filter(
      (item) =>
        item.game.title.toLowerCase().includes(collectionSearch.toLowerCase()) ||
        (item.game.title_es && item.game.title_es.toLowerCase().includes(collectionSearch.toLowerCase()))
    )
  }, [hub.mergedCollection, collectionSearch])

  const tabOptions = useMemo(
    () => [
      {
        id: 'meetups' as const,
        label: t('groups.upcomingMeetupsTab', 'Quedadas'),
        icon: Calendar,
        count: hub.upcomingMeetups.length > 0 ? hub.upcomingMeetups.length : undefined,
      },
      {
        id: 'matches' as const,
        label: t('groups.pastMatchesSubTab', 'Partidas'),
        icon: Trophy,
        count: hub.pastMeetups.length > 0 ? hub.pastMeetups.length : undefined,
      },
      {
        id: 'ludoteca' as const,
        label: t('groups.sharedLudoteca', 'Ludoteca'),
        icon: Layers,
        count: hub.mergedCollection.length,
      },
      {
        id: 'hall_of_fame' as const,
        label: t('groups.hallOfFame', 'Salón de la Fama'),
        icon: Award,
      },
      {
        id: 'table_tools' as const,
        label: t('quickLog.tableToolsTitle', 'Herramientas'),
        icon: Dices,
      },
      {
        id: 'members' as const,
        label: t('groups.members', 'Miembros'),
        icon: Users,
        count: hub.members.length,
      },
    ],
    [t, hub.upcomingMeetups.length, hub.pastMeetups.length, hub.mergedCollection.length, hub.members.length]
  )

  if (hub.loading) {
    return <GroupDetailSkeleton />
  }

  if (hub.error || !hub.group) {
    return (
      <div className="text-center py-20 space-y-4 max-w-md mx-auto">
        <div className="p-4 rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive text-sm font-semibold">
          {hub.error || t('groups.groupNotFound')}
        </div>
        <Button onClick={() => navigate('/grupos')} className="mx-auto gap-2">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('groups.backToGroups', 'Volver a Grupos')}</span>
        </Button>
      </div>
    )
  }

  return (
    <section className="space-y-6 pb-24 max-w-6xl mx-auto">
      {/* 1. Tactical Command Header */}
      <GroupDetailHeader
        group={hub.group}
        members={hub.members}
        gamesCount={hub.mergedCollection.length}
        meetupsCount={hub.upcomingMeetups.length}
        isCreator={hub.isCreator}
        isAdmin={hub.isAdmin}
        onOpenInviteDrawer={() => setIsInviteDrawerOpen(true)}
        onOpenQuickLogModal={() => navigate(`/partida/nueva?groupId=${groupId}`)}
        onDeleteGroup={hub.handleDelete}
        onLeaveGroup={hub.handleLeave}
      />

      {/* Action error banner */}
      {hub.actionError && (
        <div className="p-4 rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive text-sm font-semibold flex justify-between items-center">
          <span>{hub.actionError}</span>
          <Button onClick={() => hub.setActionError(null)} variant="ghost" size="xs" className="hover:underline text-destructive">
            {t('groups.close', 'Cerrar')}
          </Button>
        </div>
      )}

      {/* 2. Unified Tab Navigation */}
      <Tabs
        options={tabOptions}
        activeTab={activeTab}
        onChange={setActiveTab}
        scrollable
      />

      {/* 3. Dynamic Tab Content View */}
      {groupId && (
        <GroupDetailTabs
          activeTab={activeTab}
          groupId={groupId}
          hub={hub}
          user={user}
          filteredMerged={filteredMerged}
          collectionSearch={collectionSearch}
          setCollectionSearch={setCollectionSearch}
        />
      )}

      {/* 4. Unified Slide-Over Invite Drawer */}
      <GroupDetailInviteDrawer
        isOpen={isInviteDrawerOpen}
        onClose={() => setIsInviteDrawerOpen(false)}
        groupName={hub.group.name}
        inviteCode={hub.group.invite_code}
        onOpenQrModal={() => hub.setIsQrModalOpen(true)}
        onShareWhatsApp={hub.handleShareWhatsApp}
      />

      {/* Functional System Dialogs */}
      <GroupConfirmDialog
        isOpen={hub.confirmConfig.isOpen}
        onClose={() => hub.setConfirmConfig((p) => ({ ...p, isOpen: false }))}
        onConfirm={hub.confirmConfig.onConfirm}
        title={hub.confirmConfig.title}
        description={hub.confirmConfig.description}
        confirmText={hub.confirmConfig.confirmText}
        isDestructive={hub.confirmConfig.isDestructive}
      />

      <GroupInviteQrModal
        isOpen={hub.isQrModalOpen}
        onClose={() => hub.setIsQrModalOpen(false)}
        groupName={hub.group.name}
        inviteCode={hub.group.invite_code}
      />

      <AddGameToLibraryModal
        isOpen={hub.isAddGameModalOpen}
        onClose={() => hub.setIsAddGameModalOpen(false)}
        userCollectionGameIds={hub.mergedCollection.map((i) => i.game.bgg_id)}
        onAddGame={hub.addGameToGroup}
        isGroupContext
        groupMembers={[
          ...hub.members.map((m) => ({
            id: m.user_id,
            name: m.username,
            avatarUrl: m.avatar_url,
            role: m.role,
            isGuest: false,
          })),
          ...hub.guests
            .filter((g) => !g.associated_user_id)
            .map((g) => ({
              id: g.id,
              name: g.name,
              avatarUrl: g.avatar_url,
              role: 'guest' as const,
              isGuest: true,
            })),
        ]}
        currentUserId={user?.id}
        mergedCollection={hub.mergedCollection}
      />

      <QuickLogMatchModal
        isOpen={hub.isQuickLogModalOpen}
        onClose={() => hub.setIsQuickLogModalOpen(false)}
        groupId={groupId}
        groupMembers={hub.members.map((m) => ({ user_id: m.user_id, username: m.username, avatar_url: m.avatar_url }))}
        groupGuests={hub.guests.map((g) => ({ id: g.id, name: g.name, avatarUrl: g.avatar_url }))}
        groupGames={hub.mergedCollection.map((mc) => mc.game)}
        onSuccess={hub.refreshAll}
      />
    </section>
  )
}

export default GroupDetailPage
