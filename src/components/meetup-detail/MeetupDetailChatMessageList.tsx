import { FC, RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User } from '@supabase/supabase-js'
import { useTranslation } from 'react-i18next'
import { formatTime as formatTimeLocale } from '../../lib/dateLocale'

interface MeetupDetailChatMessageListProps {
  messages: any[]
  currentUser: User | null
  guestReservation: { id: string; name: string } | null
  messagesEndRef: RefObject<HTMLDivElement | null>
}

export const MeetupDetailChatMessageList: FC<MeetupDetailChatMessageListProps> = ({
  messages,
  currentUser,
  guestReservation,
  messagesEndRef,
}) => {
  const { i18n } = useTranslation()

  const formatTime = (isoString: string) => {
    try {
      return formatTimeLocale(isoString, { hour: '2-digit', minute: '2-digit' }, i18n.language as any)
    } catch {
      return ''
    }
  }

  const isOwnMessage = (msg: any) => {
    if (currentUser && msg.user_id === currentUser.id) return true
    if (guestReservation && msg.guest_id === guestReservation.id) return true
    return false
  }

  return (
    <div className="space-y-4">
      <AnimatePresence initial={false}>
        {messages.map((msg) => {
          const own = isOwnMessage(msg)
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`flex items-start gap-2.5 ${own ? 'justify-end' : 'justify-start'}`}
            >
              {!own && (
                <img
                  src={
                    msg.avatar_url ||
                    `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.sender_name)}`
                  }
                  alt={msg.sender_name}
                  className="w-8 h-8 rounded-full object-cover border border-border/40 bg-muted shrink-0 shadow-sm"
                  onError={(e) => {
                    e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                      msg.sender_name
                    )}`
                  }}
                />
              )}

              <div className={`flex flex-col max-w-[75%] ${own ? 'items-end' : 'items-start'}`}>
                {!own && (
                  <span className="text-xs font-semibold text-muted-foreground mb-1 ml-1">
                    {msg.sender_name}
                  </span>
                )}

                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words border ${
                    own
                      ? 'bg-primary text-primary-foreground border-primary/10 rounded-tr-none'
                      : 'bg-muted/70 dark:bg-muted/30 backdrop-blur-xs text-foreground border-border/20 rounded-tl-none'
                  }`}
                >
                  {msg.content}
                </div>

                <span className="text-xs text-muted-foreground/70 mt-1 px-1">
                  {formatTime(msg.created_at)}
                </span>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
      <div ref={messagesEndRef} />
    </div>
  )
}
