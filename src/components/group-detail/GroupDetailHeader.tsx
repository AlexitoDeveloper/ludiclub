import { FC } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Layers,
  Zap,
  UserPlus,
  Lock,
  Crown,
  Shield,
  Trash2,
  LogOut,
  Calendar,
} from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar'
import { DropdownIconButton, DropdownItem } from '../ui/dropdown-icon-button'
import { useTranslation } from 'react-i18next'
import { GroupMember } from '../../hooks/useGroupDetail'

interface GroupDetailHeaderProps {
  group: any
  members: GroupMember[]
  gamesCount: number
  meetupsCount: number
  isCreator: boolean
  isAdmin: boolean
  onOpenInviteDrawer: () => void
  onOpenQuickLogModal: () => void
  onDeleteGroup: () => void
  onLeaveGroup: () => void
}

export const GroupDetailHeader: FC<GroupDetailHeaderProps> = ({
  group,
  members,
  gamesCount,
  meetupsCount,
  isCreator,
  isAdmin,
  onOpenInviteDrawer,
  onOpenQuickLogModal,
  onDeleteGroup,
  onLeaveGroup,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const previewMembers = members.slice(0, 4)
  const initials = group?.name
    ? group.name
        .split(' ')
        .slice(0, 2)
        .map((w: string) => w[0])
        .join('')
        .toUpperCase()
    : 'G'

  const menuItems: DropdownItem[] = [
    ...(isCreator
      ? [
          {
            label: t('groups.deleteGroup', 'Eliminar Grupo'),
            icon: <Trash2 className="w-4 h-4 text-destructive" />,
            className: 'text-destructive font-bold',
            onClick: onDeleteGroup,
          },
        ]
      : [
          {
            label: t('groups.leaveGroup', 'Salir del Grupo'),
            icon: <LogOut className="w-4 h-4 text-destructive" />,
            className: 'text-destructive font-bold',
            onClick: onLeaveGroup,
          },
        ]),
  ]

  return (
    <>
      {/* 1. Sticky Nav Command Bar */}
      <div className="sticky top-[-2px] z-30 flex items-center justify-between gap-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 -mx-4 px-4 md:-mx-8 md:px-8 bg-background/90 backdrop-blur-md border-b border-border/20">
        <Button
          variant="ghost"
          size="sm"
          icon={ArrowLeft}
          onClick={() => navigate('/grupos')}
        >
          <span>{t('common.back', 'Grupos')}</span>
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenInviteDrawer}
          >
            <UserPlus className="w-4 h-4 text-primary" />
            <span className="hidden xs:inline">Invitar</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={onOpenQuickLogModal}
          >
            <Zap className="w-4 h-4 text-primary-foreground fill-primary-foreground" />
            <span>Registrar Partida</span>
          </Button>

          <DropdownIconButton
            items={menuItems}
            aria-label="Opciones de grupo"
            className="rounded-xl h-10 w-10 border-border/40 hover:bg-muted/50"
          />
        </div>
      </div>

      {/* 2. Tactical War Room Masthead */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-card via-card/90 to-card/60 border border-border/45 p-5 sm:p-7 shadow-sm">
        {/* Subtle accent halo */}
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 w-56 h-56 bg-primary/10 rounded-full blur-3xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div
              aria-hidden="true"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 text-primary font-black font-display text-xl sm:text-2xl flex items-center justify-center shrink-0 shadow-sm"
            >
              {initials}
            </div>

            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground font-display truncate">
                  {group.name}
                </h1>

                <Badge variant="secondary" className="text-xs font-bold py-0.5 px-2 gap-1 border-border/40">
                  <Lock className="w-3 h-3 text-muted-foreground" />
                  <span>Privado</span>
                </Badge>

                {isCreator ? (
                  <Badge variant="tag-amber" className="text-xs font-bold py-0.5 px-2 gap-1">
                    <Crown className="w-3 h-3 text-[#D97706] dark:text-[#FBBF24]" />
                    <span>Creador</span>
                  </Badge>
                ) : isAdmin ? (
                  <Badge variant="primary-soft" className="text-xs font-bold py-0.5 px-2 gap-1">
                    <Shield className="w-3 h-3" />
                    <span>Admin</span>
                  </Badge>
                ) : null}
              </div>

              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 max-w-2xl font-normal">
                {group.description || t('groups.defaultGroupDesc', 'Grupo de juego de mesa para organizar partidas y compartir ludoteca.')}
              </p>

              {/* Status metrics strip */}
              <div className="flex items-center gap-x-4 gap-y-2 pt-2 flex-wrap text-xs text-muted-foreground font-medium">
                {/* Members and games row */}
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2 overflow-hidden items-center py-0.5">
                      {previewMembers.map((m) => (
                        <Avatar key={m.user_id} className="inline-block h-6 w-6 rounded-full ring-2 ring-card">
                          <AvatarImage src={m.avatar_url || undefined} />
                          <AvatarFallback className="text-xs font-black bg-primary/20 text-primary">
                            {m.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <span className="font-mono-tabular font-bold text-foreground">
                      {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
                    </span>
                  </div>

                  <span className="text-border/60" aria-hidden="true">•</span>

                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span className="font-mono-tabular font-bold text-foreground">{gamesCount}</span>
                    <span>{gamesCount === 1 ? 'juego' : 'juegos'}</span>
                  </div>
                </div>

                {meetupsCount > 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-500 shrink-0">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="font-mono-tabular font-bold">{meetupsCount}</span>
                    <span>quedadas planeadas</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
