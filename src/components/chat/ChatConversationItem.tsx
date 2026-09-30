import { useMemo } from 'react'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Meetup, MeetupMessage, Game } from '../../types'
import { getGameCover, getGameTitle } from '../../lib/gameLocale'
import { formatTime as formatTimeLocale, AppLanguage } from '../../lib/dateLocale'
import { calculateChatUnread } from '../../lib/chatUtils'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { OptimizedImage } from '../ui/OptimizedImage'

interface ChatConversationItemProps {
  meetup: Meetup
  messages: MeetupMessage[]
  isActive: boolean
  lastReadStr?: string
  guestReservation: { id: string; name: string } | null
  userId?: string | null
  language: AppLanguage
  onSelectMeetup: (meetupId: string) => void
  onOpenDeleteDialog: (meetup: Meetup) => void
}

export function ChatConversationItem({
  meetup,
  messages,
  isActive,
  lastReadStr,
  guestReservation,
  userId,
  language,
  onSelectMeetup,
  onOpenDeleteDialog,
}: ChatConversationItemProps) {
  const { t } = useTranslation()

  const { unreadCount, hasUnread, lastMsg, isLastMsgMine } = useMemo(() => {
    return calculateChatUnread({
      messages,
      userId,
      guestResId: guestReservation?.id,
      lastReadStr,
    })
  }, [messages, userId, guestReservation, lastReadStr])

  const mGame = meetup.games
    ? ((Array.isArray(meetup.games) ? meetup.games[0] : meetup.games) as Game)
    : null

  const formatTime = (isoString: string) => {
    return formatTimeLocale(isoString, { hour: '2-digit', minute: '2-digit' }, language)
  }

  const senderLabel = isLastMsgMine ? t('chats.you') : lastMsg?.sender_name

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelectMeetup(meetup.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelectMeetup(meetup.id)}
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
            alt={getGameTitle(mGame, language) || mGame?.title || meetup.title}
            widthSize={96}
            heightSize={96}
            fit="contain"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <h4 className={`text-xs font-black truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
              {meetup.title}
            </h4>
          </div>
          <p
            className={`text-xs truncate leading-snug ${
              hasUnread ? 'text-foreground font-bold' : 'text-muted-foreground font-medium'
            }`}
          >
            {lastMsg ? (
              <>
                <span className="text-primary font-bold">{senderLabel}: </span>
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
            <Badge
              variant="default"
              className="h-5 min-w-[20px] px-1.5 rounded-full text-xs font-black leading-none shadow-xs shadow-primary/20 font-mono-tabular"
            >
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
              onOpenDeleteDialog(meetup)
            }}
            className="opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity rounded-md"
          >
            <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
          </Button>
        </div>
      </div>
    </div>
  )
}
