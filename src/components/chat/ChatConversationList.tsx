import { useMemo } from 'react'
import { MessageSquare, Trash2, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/authContext'
import { formatTime as formatTimeLocale } from '../../lib/dateLocale'
import { Meetup, MeetupMessage, Game } from '../../types'
import { getGameCover, getGameTitle } from '../../lib/gameLocale'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Skeleton } from '../ui/skeleton'
import { OptimizedImage } from '../ui/OptimizedImage'

interface ChatConversationListProps {
  meetups: Meetup[]
  allMessages: MeetupMessage[]
  activeMeetupId: string | null
  readTimestamps: Record<string, string>
  loading: boolean
  onSelectMeetup: (meetupId: string) => void
  onOpenDeleteDialog: (meetup: Meetup) => void
  getReservation: (meetupId: string) => { id: string; name: string } | null
}

export function ChatConversationList({
  meetups,
  allMessages,
  activeMeetupId,
  readTimestamps,
  loading,
  onSelectMeetup,
  onOpenDeleteDialog,
  getReservation
}: ChatConversationListProps) {
  const { t } = useTranslation()
  const { user, language } = useAuth()
  const navigate = useNavigate()

  // Messages grouped by meetup id for fast unread & snippet lookup
  const messagesByMeetup = useMemo(() => {
    const map = new Map<string, MeetupMessage[]>()
    for (const msg of allMessages) {
      const list = map.get(msg.meetup_id) || []
      list.push(msg)
      map.set(msg.meetup_id, list)
    }
    return map
  }, [allMessages])

  const formatTime = (isoString: string) => {
    return formatTimeLocale(isoString, { hour: '2-digit', minute: '2-digit' }, language)
  }

  if (loading && meetups.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/30 bg-card/40">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="flex-1 min-w-0 space-y-2">
              <Skeleton className="h-3.5 w-2/5" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <Skeleton className="w-8 h-4 shrink-0 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (meetups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border/40 flex items-center justify-center text-muted-foreground/60">
          <MessageSquare className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-foreground">{t('chats.emptyRooms')}</h3>
          <p className="text-xs text-muted-foreground max-w-[220px] leading-relaxed mx-auto">
            {t('chats.emptyRoomsDesc')}
          </p>
        </div>
        <Button onClick={() => navigate('/jugar')} size="sm" className="mt-2 gap-1.5 shadow-sm">
          <span>{t('chats.goToPlay')}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-2.5 sm:p-3.5 space-y-2">
      {meetups.map((m) => {
        const mGame = m.games ? (Array.isArray(m.games) ? m.games[0] : m.games) as Game : null
        const mMessages = messagesByMeetup.get(m.id) || []
        const lastMsg = mMessages[mMessages.length - 1]

        const lastReadStr = readTimestamps[m.id] || ''
        const lastRead = lastReadStr ? new Date(lastReadStr).getTime() : 0
        const guestRes = getReservation(m.id)

        const unreadCount = mMessages.filter(msg => {
          const isMy = msg.user_id === user?.id || (guestRes && msg.guest_id === guestRes.id)
          return !isMy && new Date(msg.created_at).getTime() > lastRead
        }).length

        const isActive = activeMeetupId === m.id
        const hasUnread = unreadCount > 0

        return (
          <div
            key={m.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectMeetup(m.id)}
            onKeyDown={(e) => e.key === 'Enter' && onSelectMeetup(m.id)}
            className={`w-full text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-3 group/item ${
              isActive
                ? 'bg-primary/10 border-primary/40 shadow-xs'
                : 'bg-card/60 dark:bg-card/20 border-border/30 hover:bg-card hover:border-border/60 hover:-translate-y-[0.5px]'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl bg-background border border-border/30 overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-2xs">
                <OptimizedImage
                  src={getGameCover(mGame, language) || mGame?.image_url}
                  fallbackSrc={mGame?.image_url}
                  alt={getGameTitle(mGame, language) || mGame?.title || m.title}
                  widthSize={96}
                  heightSize={96}
                  fit="contain"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <h4 className={`text-xs font-black truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {m.title}
                  </h4>
                </div>
                <p className={`text-xs truncate leading-snug ${hasUnread ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'}`}>
                  {lastMsg ? (
                    <>
                      <span className="text-primary font-bold">{lastMsg.sender_name}: </span>
                      <span>{lastMsg.content}</span>
                    </>
                  ) : (
                    <span className="italic text-muted-foreground/60">{t('chats.noMessages')}</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end justify-between shrink-0 h-10 min-w-[3.5rem] py-0.5">
              {lastMsg ? (
                <span className="text-xs font-semibold text-muted-foreground font-mono-tabular">
                  {formatTime(lastMsg.created_at)}
                </span>
              ) : (
                <div className="h-3" />
              )}

              <div className="flex items-center gap-1.5 mt-auto">
                {unreadCount > 0 && (
                  <Badge variant="default" className="h-5 min-w-[20px] px-1.5 rounded-full text-xs font-black leading-none shadow-xs shadow-primary/20 font-mono-tabular">
                    {unreadCount}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={t('chats.deleteChat')}
                  title={t('chats.deleteChat')}
                  onClick={(e) => {
                    e.stopPropagation()
                    onOpenDeleteDialog(m)
                  }}
                  className="opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                </Button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
