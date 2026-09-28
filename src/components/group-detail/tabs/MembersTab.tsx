import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, Search, X, Users } from 'lucide-react'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { Input } from '../../ui/input'
import { FilterChip } from '../../ui/chip'
import { Card } from '../../ui/card'
import { GroupMember, GroupGuest } from '../../../hooks/useGroupDetail'
import { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { AddGroupGuestModal } from '../AddGroupGuestModal'
import { AssociateGuestModal } from '../AssociateGuestModal'
import { GroupMemberCard } from '../GroupMemberCard'
import { GroupGuestCard } from '../GroupGuestCard'

interface MembersTabProps {
  members: GroupMember[]
  guests?: GroupGuest[]
  user: User | null
  group: any
  isAdmin: boolean
  handleKick: (userId: string, username: string) => void
  onAddGuest?: (name: string) => Promise<boolean | void>
  onRemoveGuest?: (guestId: string) => Promise<void>
  onAssociateGuest?: (guestId: string, userId: string) => Promise<void>
}

export const MembersTab: React.FC<MembersTabProps> = ({
  members,
  guests = [],
  user,
  group,
  isAdmin,
  handleKick,
  onAddGuest,
  onRemoveGuest,
  onAssociateGuest,
}) => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const language = i18n.language as any

  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState<'all' | 'members' | 'guests'>('all')
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false)
  const [associatingGuest, setAssociatingGuest] = useState<GroupGuest | null>(null)

  const query = searchQuery.trim().toLowerCase()

  const filteredMembers = useMemo(() => {
    if (filterRole === 'guests') return []
    if (!query) return members
    return members.filter((m) => m.username.toLowerCase().includes(query))
  }, [members, query, filterRole])

  const filteredGuests = useMemo(() => {
    if (filterRole === 'members') return []
    if (!query) return guests
    return guests.filter((g) => g.name.toLowerCase().includes(query))
  }, [guests, query, filterRole])

  const existingGuestNames = guests.map((g) => g.name)
  const hasNoResults = query.length > 0 && filteredMembers.length === 0 && filteredGuests.length === 0

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-black font-display tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <span>{t('groups.members', 'Comunidad y miembros')}</span>
          </h2>
          <Badge variant="secondary" size="sm" className="font-bold">
            {members.length + guests.length}
          </Badge>
        </div>

        {onAddGuest && (
          <Button
            size="sm"
            onClick={() => setIsAddGuestOpen(true)}
            className="rounded-xl font-bold text-xs h-9 px-3.5 gap-1.5 shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{t('groups.addGuestBtn', 'Añadir Invitado')}</span>
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('groups.searchMembersPlaceholder', 'Buscar miembro o invitado...')}
          className="pl-9 pr-8 h-10 bg-card/60 border-border/40 rounded-xl text-xs"
        />
        {searchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground hover:text-foreground rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Segmented Filter Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <FilterChip onClick={() => setFilterRole('all')} selected={filterRole === 'all'} size="sm">
          Todos ({members.length + guests.length})
        </FilterChip>
        <FilterChip onClick={() => setFilterRole('members')} selected={filterRole === 'members'} size="sm">
          Miembros ({members.length})
        </FilterChip>
        {guests.length > 0 && (
          <FilterChip onClick={() => setFilterRole('guests')} selected={filterRole === 'guests'} size="sm">
            Invitados ({guests.length})
          </FilterChip>
        )}
      </div>

      {hasNoResults && (
        <Card className="p-8 text-center border-dashed border-border/50 bg-card/30 rounded-2xl space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {t('groups.noMembersFound', 'No se encontraron resultados')}
          </p>
          <Button variant="outline" size="sm" onClick={() => setSearchQuery('')} className="rounded-xl font-bold text-xs h-9 mt-1">
            {t('common.clearFilter', 'Limpiar búsqueda')}
          </Button>
        </Card>
      )}

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredMembers.map((member) => (
          <GroupMemberCard
            key={member.user_id}
            member={member}
            isMe={member.user_id === user?.id}
            isMemberCreator={member.user_id === group?.creator_id}
            isMemberAdmin={member.role === 'admin'}
            canKick={Boolean(isAdmin && member.user_id !== group?.creator_id && member.user_id !== user?.id)}
            onProfileClick={() => navigate(member.user_id === user?.id ? '/perfil' : `/perfil/${member.user_id}`)}
            onKick={() => handleKick(member.user_id, member.username)}
            language={language}
          />
        ))}

        {filteredGuests.map((guest) => {
          const associatedMember = guest.associated_user_id
            ? members.find((m) => m.user_id === guest.associated_user_id)
            : null

          return (
            <GroupGuestCard
              key={guest.id}
              guest={guest}
              associatedMember={associatedMember}
              isAdmin={isAdmin}
              onAssociate={onAssociateGuest ? () => setAssociatingGuest(guest) : undefined}
              onRemove={onRemoveGuest ? () => onRemoveGuest(guest.id) : undefined}
              onProfileClick={(target) => navigate(target === user?.id ? '/perfil' : `/perfil/${target}`)}
              language={language}
            />
          )
        })}
      </div>

      {/* Modals */}
      {onAddGuest && (
        <AddGroupGuestModal
          isOpen={isAddGuestOpen}
          onClose={() => setIsAddGuestOpen(false)}
          onAddGuest={onAddGuest}
          existingGuestNames={existingGuestNames}
        />
      )}

      {onAssociateGuest && associatingGuest && (
        <AssociateGuestModal
          isOpen={Boolean(associatingGuest)}
          onClose={() => setAssociatingGuest(null)}
          guest={associatingGuest}
          members={members}
          onAssociate={onAssociateGuest}
        />
      )}
    </div>
  )
}

export default MembersTab
