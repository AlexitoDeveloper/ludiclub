import { useState } from 'react'
import { CalendarCheck2, MessageSquare, Crown, LogOut, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Meetup, UserProfile } from '@/types'
import { useTranslation } from 'react-i18next'
import { DeleteTableConfirmDialog } from './DeleteTableConfirmDialog'

interface MeetupDetailActionDockProps {
  meetup: Meetup
  attendees: UserProfile[]
  isPast: boolean
  isJoined: boolean
  isFull: boolean
  joining: boolean
  spotsRemaining: number
  guestReservation: { id: string; name: string } | null
  handleJoinLeave: () => void
  onNavigateToChat: () => void
  isCreator?: boolean
  handleCancelMeetup?: () => void
  canceling?: boolean
}

export function MeetupDetailActionDock({
  meetup,
  attendees,
  isPast,
  isJoined,
  isFull,
  joining,
  spotsRemaining,
  guestReservation,
  handleJoinLeave,
  onNavigateToChat,
  isCreator = false,
  handleCancelMeetup,
  canceling = false,
}: MeetupDetailActionDockProps) {
  const { t } = useTranslation()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Find organizer profile
  const organizer = attendees.find((a) => a.id === meetup.creator_id)
  const isGuestReserved = Boolean(guestReservation)
  const isParticipant = isJoined || isGuestReserved

  // Avatar stack for first 3-4 attendees
  const visibleAttendees = attendees.slice(0, 3)
  const extraCount = attendees.length - visibleAttendees.length

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/40 shadow-2xl px-4 py-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
        {/* Left Side: Confirmed spots & Host info */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Overlapping Avatar Stack with Host Crown */}
          <div className="relative flex items-center -space-x-2.5 shrink-0">
            {visibleAttendees.map((attendee) => {
              const isHost = attendee.id === meetup.creator_id
              return (
                <div key={attendee.id} className="relative group">
                  <Avatar className="w-8 h-8 border-2 border-background ring-1 ring-border/30 shadow-sm">
                    <AvatarImage src={attendee.avatar_url || undefined} alt={attendee.username} />
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {attendee.username?.slice(0, 2).toUpperCase() || 'PL'}
                    </AvatarFallback>
                  </Avatar>
                  {isHost && (
                    <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full flex items-center justify-center text-zinc-950 shadow-sm ring-1 ring-background">
                      <Crown className="w-2.5 h-2.5 fill-current" />
                    </div>
                  )}
                </div>
              )
            })}
            {extraCount > 0 && (
              <div className="w-8 h-8 rounded-full border-2 border-background bg-muted/80 flex items-center justify-center text-xs font-black text-muted-foreground ring-1 ring-border/30">
                +{extraCount}
              </div>
            )}
          </div>

          {/* Spots count & Host label */}
          <div className="min-w-0 flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-foreground font-mono-tabular">
                {attendees.length}/{meetup.max_players}
              </span>
              <Badge
                variant={isFull ? 'destructive' : spotsRemaining === 1 ? 'warning' : 'primary-soft'}
                className="text-xs px-1.5 py-0 font-bold"
              >
                {isPast
                  ? t('common.completed')
                  : isFull
                  ? t('common.full')
                  : `${spotsRemaining} ${spotsRemaining === 1 ? t('common.free') : t('common.frees')}`}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground truncate font-medium">
              {organizer ? `${t('create.organizedBy')} ${organizer.username}` : t('common.host')}
            </span>
          </div>
        </div>

        {/* Right Side: Primary CTA */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isCreator ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="default"
                size="sm"
                onClick={onNavigateToChat}
                className="cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('meetup.chatTitle')}</span>
              </Button>
              {handleCancelMeetup && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  title={t('meetup.cancelTable', 'Cancelar Mesa')}
                  aria-label={t('meetup.cancelTable', 'Cancelar Mesa')}
                  className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
            </div>
          ) : isPast ? (
            <Button disabled variant="outline" size="sm" className="select-none">
              {t('meetup.tableClosed')}
            </Button>
          ) : joining ? (
            <Button disabled size="sm" loading />
          ) : isParticipant ? (
            <div className="flex items-center gap-1.5">
              <Button
                variant="default"
                size="sm"
                onClick={onNavigateToChat}
                className="cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t('meetup.chatTitle')}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleJoinLeave}
                title={t('meetup.leaveTable')}
                aria-label={t('meetup.leaveTable')}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : isFull ? (
            <Button disabled variant="outline" size="sm" className="select-none">
              {t('meetup.tableFull')}
            </Button>
          ) : (
            <Button
              variant="premium"
              size="sm"
              onClick={handleJoinLeave}
              className="cursor-pointer"
            >
              <CalendarCheck2 className="w-4 h-4" />
              <span>{t('meetup.joinTable')}</span>
            </Button>
          )}
        </div>
      </div>

      {handleCancelMeetup && (
        <DeleteTableConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirmDelete={handleCancelMeetup}
          isDeleting={canceling}
          tableTitle={meetup.title}
        />
      )}
    </div>
  )
}
