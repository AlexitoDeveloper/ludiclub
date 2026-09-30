import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Lock, Loader2, MessageSquare } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Meetup, UserProfile } from '../../types'
import { useSingleMeetupChat } from '../../hooks/useSingleMeetupChat'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Form } from '../ui/form'
import { useTranslation } from 'react-i18next'
import { formatTime as formatTimeLocale } from '../../lib/dateLocale'
import { setChatLastRead } from '../../lib/chatUtils'

interface MeetupDetailChatProps {
  meetupId: string | undefined
  currentUser: User | null
  guestReservation: { id: string; name: string } | null
  meetup: Meetup | null
  attendees: UserProfile[]
}

export function MeetupDetailChat({
  meetupId,
  currentUser,
  guestReservation,
  meetup,
  attendees
}: MeetupDetailChatProps) {
  const { t, i18n } = useTranslation()
  const { messages, loading, error, sendMessage, isAttendee } = useSingleMeetupChat(
    meetupId,
    currentUser,
    guestReservation,
    meetup,
    attendees
  )

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom on new messages
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior
      })
    }
  }

  useEffect(() => {
    if (messages.length > 0) {
      // Use instant scroll on initial mount, smooth scroll afterwards
      scrollToBottom(loading ? 'auto' : 'smooth')
    }
  }, [messages, loading])

  useEffect(() => {
    if (meetupId && messages.length > 0) {
      setChatLastRead(meetupId)
    }
  }, [meetupId, messages.length])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending) return

    setSending(true)
    try {
      await sendMessage(content)
      setInput('')
    } catch (err) {
      console.error('Error sending message:', err)
    } finally {
      setSending(false)
    }
  }

  // Format timestamp (e.g. 14:35)
  const formatTime = (isoString: string) => {
    try {
      return formatTimeLocale(isoString, { hour: '2-digit', minute: '2-digit' }, i18n.language as any)
    } catch {
      return ''
    }
  }

  // Identify if a message belongs to the current user
  const isOwnMessage = (msg: any) => {
    if (currentUser && msg.user_id === currentUser.id) return true
    if (guestReservation && msg.guest_id === guestReservation.id) return true
    return false
  }

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[500px] transition-all duration-300 hover:shadow-2xl">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{t('meetup.chatTitle')}</h3>
          </div>  
        </div>
      </div>

      {/* Message Area */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-border/40"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground animate-pulse">{t('meetup.chatLoading')}</p>
          </div>
        ) : error ? (
          <div className="text-center p-4 text-destructive bg-destructive/10 rounded-2xl border border-destructive/20 text-xs">
            {error}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground/60 border border-border/20">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground/80">{t('meetup.chatEmptyTitle')}</p>
              <p className="text-xs text-muted-foreground max-w-[200px] mx-auto mt-1">
                {t('meetup.chatEmptyDesc')}
              </p>
            </div>
          </div>
        ) : (
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
                    {/* Other User Avatar */}
                    {!own && (
                      <img
                        src={msg.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.sender_name)}`}
                        alt={msg.sender_name}
                        className="w-8 h-8 rounded-full object-cover border border-border/40 bg-muted shrink-0 shadow-sm"
                        onError={(e) => {
                          e.currentTarget.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(msg.sender_name)}`
                        }}
                      />
                    )}

                    {/* Message Bubble Column */}
                    <div className={`flex flex-col max-w-[75%] ${own ? 'items-end' : 'items-start'}`}>
                      {/* Sender Name (only for others) */}
                      {!own && (
                        <span className="text-xs font-semibold text-muted-foreground mb-1 ml-1">
                          {msg.sender_name}
                        </span>
                      )}
                      
                      {/* Bubble */}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words border ${
                          own
                            ? 'bg-primary text-primary-foreground border-primary/10 rounded-tr-none'
                            : 'bg-muted/70 dark:bg-muted/30 backdrop-blur-xs text-foreground border-border/20 rounded-tl-none'
                        }`}
                      >
                        {msg.content}
                      </div>

                      {/* Timestamp */}
                      <span className="text-xs text-muted-foreground/70 mt-1 px-1">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>

                    {/* Own Avatar (optional, let's keep it clean without avatar for own to look like modern messaging apps, or we can add it. Modern standard is no avatar for own). */}
                  </motion.div>
                )
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input / Control Area */}
      <div className="p-4 border-t border-border/40 bg-muted/10">
        {isAttendee ? (
          <Form onSubmit={handleSend} className="flex gap-2">
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('meetup.chatPlaceholder')}
              maxLength={500}
              className="flex-1"
              disabled={sending}
            />
            <Button
              type="submit"
              disabled={sending || !input.trim()}
              size="icon"
              className="rounded-xl shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </Form>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 backdrop-blur-xs border border-border/30 rounded-2xl text-xs text-muted-foreground justify-center">
            <Lock className="w-4 h-4 text-muted-foreground/75" />
            <span>{t('meetup.joinToReadChat')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
