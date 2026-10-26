import React, { useState, useEffect, useRef } from 'react'
import { Send, Lock, Loader2, MessageSquare } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Meetup, UserProfile } from '../../types'
import { useSingleMeetupChat } from '../../hooks/useSingleMeetupChat'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Form } from '../ui/form'
import { useTranslation } from 'react-i18next'
import { setChatLastRead } from '../../lib/chatUtils'
import { MeetupDetailChatGuestPrompt } from './MeetupDetailChatGuestPrompt'
import { MeetupDetailChatMessageList } from './MeetupDetailChatMessageList'

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
  attendees,
}: MeetupDetailChatProps) {
  const { t } = useTranslation()
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

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior,
      })
    }
  }

  useEffect(() => {
    if (messages.length > 0) {
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

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-3xl shadow-xl overflow-hidden flex flex-col h-[500px] transition-all duration-300 hover:shadow-2xl">
      {/* Chat Header */}
      <div className="px-6 py-4 border-b border-border/40 bg-gradient-to-r from-primary/5 to-transparent flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-foreground">{t('meetup.chatTitle')}</h3>
        </div>
      </div>

      {/* Guest conversion banner or Active Chat */}
      {!currentUser ? (
        <MeetupDetailChatGuestPrompt />
      ) : (
        <>
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
              <MeetupDetailChatMessageList
                messages={messages}
                currentUser={currentUser}
                guestReservation={guestReservation}
                messagesEndRef={messagesEndRef}
              />
            )}
          </div>

          {/* Input / Control Area */}
          <div className="p-4 border-t border-border/40 bg-muted/10 shrink-0">
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
                  className="shrink-0 cursor-pointer"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </Form>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 bg-muted/40 backdrop-blur-xs border border-border/30 rounded-2xl text-xs text-muted-foreground justify-center">
                <Lock className="w-4 h-4 text-muted-foreground/75" />
                <span>{t('meetup.joinToReadChat')}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
