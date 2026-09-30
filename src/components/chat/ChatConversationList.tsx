import { useMemo } from 'react'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/authContext'
import { Meetup, MeetupMessage } from '../../types'
import { Button } from '../ui/button'
import { Skeleton } from '../ui/skeleton'
import { ChatConversationItem } from './ChatConversationItem'

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
  getReservation,
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
      {meetups.map((m) => (
        <ChatConversationItem
          key={m.id}
          meetup={m}
          messages={messagesByMeetup.get(m.id) || []}
          isActive={activeMeetupId === m.id}
          lastReadStr={readTimestamps[m.id]}
          guestReservation={getReservation(m.id)}
          userId={user?.id}
          language={language}
          onSelectMeetup={onSelectMeetup}
          onOpenDeleteDialog={onOpenDeleteDialog}
        />
      ))}
    </div>
  )
}
