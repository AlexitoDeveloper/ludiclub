import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MessageSquare } from 'lucide-react'
import { useAuth } from '../lib/authContext'
import { useMeetupChat } from '../hooks/useMeetupChat'
import { Badge } from '../components/ui/badge'
import { ChatConversationList } from '../components/chat/ChatConversationList'
import { ChatHeader } from '../components/chat/ChatHeader'
import { ChatMessageStream } from '../components/chat/ChatMessageStream'
import { ChatMessageInputDock } from '../components/chat/ChatMessageInputDock'
import { ChatDeleteDialog } from '../components/chat/ChatDeleteDialog'
import { Meetup } from '../types'

export function ChatsPage() {
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const activeMeetupId = searchParams.get('id')

  const {
    visibleMeetups, allMessages, activeMeetup, activeGame, activeChatMessages,
    loading, sending, errorMsg, readTimestamps, markAsRead, sendMessage,
    hideConversation, deleteMeetup, getReservation
  } = useMeetupChat(activeMeetupId)

  const [deleteTargetMeetup, setDeleteTargetMeetup] = useState<Meetup | null>(null)

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth')
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (activeMeetupId) markAsRead(activeMeetupId)
  }, [activeMeetupId, markAsRead])

  useEffect(() => {
    if (window.innerWidth >= 768 && !activeMeetupId && visibleMeetups.length > 0) {
      setSearchParams({ id: visibleMeetups[0].id }, { replace: true })
    }
  }, [visibleMeetups, activeMeetupId, setSearchParams])

  const handleBack = () => setSearchParams({})

  return (
    <section className="h-full flex-grow flex-1 min-h-0 w-full md:mx-auto max-w-5xl flex flex-col md:flex-row border-x-0 border-y-0 md:border md:border-border/30 bg-card/95 md:bg-card/65 backdrop-blur-2xl rounded-none md:rounded-2xl overflow-hidden shadow-none md:shadow-2xl relative">
      {/* ── Left conversations list ── */}
      <div className={`w-full md:w-80 md:min-w-[20rem] md:max-w-[20rem] md:shrink-0 border-r border-border/40 flex flex-col bg-card/45 h-full ${activeMeetupId ? 'hidden md:flex' : 'flex'}`}>
        <div className="px-4 sm:px-5 pt-[calc(1rem+env(safe-area-inset-top))] pb-3.5 border-b border-border/30 flex items-center justify-between bg-card md:pt-4 shadow-2xs shrink-0 sticky top-0 z-10">
          <h1 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2 text-foreground">
            <MessageSquare className="w-5 h-5 text-primary" />
            <span>{t('chats.title')}</span>
          </h1>
          <Badge variant="secondary" className="text-xs px-2.5 py-0.5 font-bold">
            {visibleMeetups.length} {visibleMeetups.length === 1 ? t('chats.roomCount_one') : t('chats.roomCount_other')}
          </Badge>
        </div>

        <ChatConversationList
          meetups={visibleMeetups}
          allMessages={allMessages}
          activeMeetupId={activeMeetupId}
          readTimestamps={readTimestamps}
          loading={loading}
          onSelectMeetup={(id) => { setSearchParams({ id }); markAsRead(id) }}
          onOpenDeleteDialog={setDeleteTargetMeetup}
          getReservation={getReservation}
        />
      </div>

      {/* ── Right chat window ── */}
      <div className={`flex-grow flex-1 h-full min-h-0 flex flex-col bg-card/10 relative min-w-0 overflow-hidden ${!activeMeetupId ? 'hidden md:flex' : 'flex'}`}>
        {activeMeetup ? (
          <>
            <ChatHeader
              meetup={activeMeetup}
              game={activeGame}
              onBack={handleBack}
              onOpenDeleteDialog={() => setDeleteTargetMeetup(activeMeetup)}
            />
            {errorMsg && (
              <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 text-xs font-semibold text-destructive text-center shrink-0">
                {errorMsg}
              </div>
            )}
            <ChatMessageStream
              key={activeMeetup.id}
              messages={activeChatMessages}
              guestReservation={getReservation(activeMeetup.id)}
            />
            <ChatMessageInputDock onSendMessage={sendMessage} sending={sending} />
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground/50 space-y-3 p-8">
            <MessageSquare className="w-14 h-14 opacity-20" />
            <h3 className="text-sm font-black text-foreground/80">{t('chats.noChatSelected')}</h3>
            <p className="text-xs text-muted-foreground max-w-[240px] leading-relaxed">
              {t('chats.noChatSelectedDesc')}
            </p>
          </div>
        )}
      </div>

      {/* Delete / Hide modal */}
      <ChatDeleteDialog
        meetup={deleteTargetMeetup}
        userId={user?.id}
        onClose={() => setDeleteTargetMeetup(null)}
        onHide={(id) => { hideConversation(id); if (activeMeetupId === id) handleBack() }}
        onDelete={async (id) => { await deleteMeetup(id); if (activeMeetupId === id) handleBack() }}
      />
    </section>
  )
}

export default ChatsPage
