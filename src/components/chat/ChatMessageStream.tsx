import { useEffect, useRef } from 'react'
import { MessageSquare, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../lib/authContext'
import { formatDate, formatTime as formatTimeLocale } from '../../lib/dateLocale'
import { MeetupMessage } from '../../types'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'

interface ChatMessageStreamProps {
  messages: MeetupMessage[]
  guestReservation: { id: string; name: string } | null
}

export function ChatMessageStream({
  messages,
  guestReservation
}: ChatMessageStreamProps) {
  const { t } = useTranslation()
  const { user, language } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)

  // Scroll strictly within this container — NEVER call scrollIntoView which scrolls the window/page
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const scrollToBottom = () => {
      if (isFirstLoad.current) {
        el.scrollTop = el.scrollHeight
        isFirstLoad.current = false
      } else {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: 'smooth'
        })
      }
    }

    const rafId = requestAnimationFrame(scrollToBottom)
    return () => cancelAnimationFrame(rafId)
  }, [messages])

  const formatTime = (isoString: string) => {
    return formatTimeLocale(isoString, { hour: '2-digit', minute: '2-digit' }, language)
  }

  const formatDateLabel = (isoString: string) => {
    const d = new Date(isoString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return language === 'es' ? 'Hoy' : 'Today'
    if (d.toDateString() === yesterday.toDateString()) return language === 'es' ? 'Ayer' : 'Yesterday'
    return formatDate(isoString, { day: 'numeric', month: 'short' }, language)
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-3 p-8 bg-zinc-950/5 dark:bg-black/20">
        <div className="w-12 h-12 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-center text-muted-foreground/50">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div className="space-y-1 max-w-[240px]">
          <h3 className="text-xs font-bold text-foreground">{t('chats.emptyActiveRoom')}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('chats.emptyActiveRoomDesc')}
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">
          <Sparkles className="w-3 h-3" />
          <span>¡Saluda a los jugadores de la mesa!</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 space-y-3.5 bg-zinc-950/5 dark:bg-black/20"
    >
      {messages.map((msg, idx) => {
        const isMyMessage = msg.user_id === user?.id || (Boolean(msg.guest_id) && msg.guest_id === guestReservation?.id)

        const prevMsg = idx > 0 ? messages[idx - 1] : null
        const showDateLabel = !prevMsg || new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString()

        return (
          <div key={msg.id} className="space-y-2.5">
            {showDateLabel && (
              <div className="flex justify-center select-none py-1">
                <span className="bg-background/90 dark:bg-card border border-border/40 rounded-full px-3 py-0.5 text-xs font-bold text-muted-foreground shadow-2xs font-mono-tabular">
                  {formatDateLabel(msg.created_at)}
                </span>
              </div>
            )}

            <div className={`flex gap-2 sm:gap-2.5 max-w-[88%] sm:max-w-[80%] ${isMyMessage ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}>
              {/* Member Avatar (for group messages) */}
              {!isMyMessage && (
                <Avatar className="w-7 h-7 sm:w-8 sm:h-8 border border-border/40 shrink-0 mt-0.5 shadow-2xs">
                  <AvatarImage src={msg.avatar_url || undefined} alt={msg.sender_name} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                    {msg.sender_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className="space-y-1 min-w-0 max-w-full">
                {/* Sender name for group members */}
                {!isMyMessage && (
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="text-xs font-black text-primary truncate tracking-tight">
                      {msg.sender_name}
                    </span>
                    {msg.guest_id && (
                      <span className="text-xs text-muted-foreground font-medium lowercase">
                        ({t('chats.guestTag')})
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`p-3 sm:p-3.5 rounded-2xl shadow-2xs text-xs leading-relaxed break-words border transition-all ${
                    isMyMessage
                      ? 'bg-primary text-primary-foreground border-primary/20 rounded-tr-xs selection:bg-black/30'
                      : 'bg-card text-foreground border-border/40 rounded-tl-xs shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap font-medium">{msg.content}</p>
                </div>

                {/* Timestamp */}
                <span
                  className={`text-xs block font-semibold text-muted-foreground/75 px-1 font-mono-tabular ${
                    isMyMessage ? 'text-right' : 'text-left'
                  }`}
                >
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
