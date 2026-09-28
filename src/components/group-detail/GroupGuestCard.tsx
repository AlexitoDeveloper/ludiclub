import React from 'react'
import { Link2, Trash2 } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { GroupGuest, GroupMember } from '../../hooks/useGroupDetail'
import { formatDate, AppLanguage } from '../../lib/dateLocale'
import { useTranslation } from 'react-i18next'

interface GroupGuestCardProps {
  guest: GroupGuest
  associatedMember?: GroupMember | null
  isAdmin: boolean
  onAssociate?: () => void
  onRemove?: () => void
  onProfileClick?: (userIdOrUsername: string) => void
  language?: AppLanguage
}

export const GroupGuestCard: React.FC<GroupGuestCardProps> = ({
  guest,
  associatedMember,
  isAdmin,
  onAssociate,
  onRemove,
  onProfileClick,
  language,
}) => {
  const { t } = useTranslation()

  return (
    <Card className="p-3.5 rounded-2xl bg-card/75 border-border/30 shadow-xs flex items-center justify-between gap-3 hover:border-border/60 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-10 w-10 border border-primary/25 shrink-0 bg-primary/10">
          <AvatarImage src={guest.avatar_url || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-black">
            {guest.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-extrabold text-sm text-foreground truncate">
              {guest.name}
            </span>
            {associatedMember ? (
              <Badge
                variant="primary-soft"
                onClick={(e) => {
                  e.stopPropagation()
                  onProfileClick?.(associatedMember.user_id || associatedMember.username)
                }}
                className="text-xs px-1.5 py-0.5 leading-tight gap-1 cursor-pointer hover:bg-primary/20 hover:border-primary/40 transition-colors"
                title={t('groups.viewLinkedProfile', 'Ver perfil de @{{username}}', { username: associatedMember.username })}
              >
                <Link2 className="w-2.5 h-2.5 shrink-0" aria-hidden="true" />
                <span className="truncate">@{associatedMember.username}</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs px-1.5 py-0 leading-tight">
                {t('groups.habitualGuestBadge', 'Invitado habitual')}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground font-semibold font-mono-tabular mt-0.5">
            {t('groups.guestAdded', 'Añadido')}{' '}
            {formatDate(guest.created_at, { day: 'numeric', month: 'short', year: 'numeric' }, language)}
          </p>
        </div>
      </div>

      {isAdmin && (
        <div className="flex items-center gap-0.5 shrink-0">
          {onAssociate && (
            <Button
              type="button"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onAssociate()
              }}
              title={t('groups.linkToAccount', 'Vincular a cuenta')}
              aria-label={t('groups.linkToAccount', 'Vincular a cuenta')}
              className="rounded-xl text-primary hover:bg-primary/10 font-bold h-11 w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center cursor-pointer transition-colors"
            >
              <Link2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}

          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                onRemove()
              }}
              title={t('common.delete', 'Eliminar')}
              aria-label={t('common.delete', 'Eliminar')}
              className="rounded-xl text-destructive hover:bg-destructive/10 font-bold h-11 w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center cursor-pointer transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      )}
    </Card>
  )
}
