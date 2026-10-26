import { useState, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/authContext'
import { useMeetupDetail } from '../hooks/useMeetupDetail'
import { Button } from '../components/ui/button'
import { 
  ArrowLeft, 
  Check, 
  Share2, 
  Loader2, 
  Info,
  X,
  Trophy,
  Download,
  Calendar,
  Crown,
  Dices
} from 'lucide-react'
import { toPng } from 'html-to-image'
import { cn } from '../lib/utils'
import { useGameLocale } from '../hooks/useGameLocale'
import { formatDate } from '../lib/dateLocale'
import { AnimatePresence, motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { ExpansionBadge } from '../components/ui/expansion-badge'

// Import subcomponents
import { MeetupDetailHero } from '../components/meetup-detail/MeetupDetailHero'
import { MeetupDetailDescription } from '../components/meetup-detail/MeetupDetailDescription'
import { MeetupDetailAttendees } from '../components/meetup-detail/MeetupDetailAttendees'
import { MeetupDetailLocation } from '../components/meetup-detail/MeetupDetailLocation'
import { MeetupDetailOnline } from '../components/meetup-detail/MeetupDetailOnline'
import { MeetupDetailSidebar } from '../components/meetup-detail/MeetupDetailSidebar'
import { MeetupDetailActionDock } from '../components/meetup-detail/MeetupDetailActionDock'
import { FirstPlayerSelector } from '../components/session/FirstPlayerSelector'
import { LiveScoreTracker } from '../components/session/LiveScoreTracker'
import { BoardPhotoUploader } from '../components/session/BoardPhotoUploader'
import { VictoryCardModal } from '../components/session/VictoryCardModal'
import { MeetupDetailSkeleton } from '../components/meetup-detail/MeetupDetailSkeleton'

const BACKGROUNDS: Record<string, string> = {
  default: 'from-[#141b29] via-[#0e121b] to-[#0a362e]',
  sunset: 'from-indigo-950 via-purple-950 to-pink-900',
  cyberpunk: 'from-slate-950 via-violet-950 to-indigo-900',
  ocean: 'from-slate-950 via-sky-950 to-cyan-900',
  volcanic: 'from-stone-950 via-stone-900 to-red-950',
  'midnight-gold': 'from-zinc-950 via-zinc-900 to-amber-950',
};

const GLOWS: Record<string, { g1: string; g2: string; g3: string }> = {
  default: {
    g1: 'from-primary/20 to-teal-600/20',
    g2: 'from-teal-500/20 to-emerald-600/20',
    g3: 'bg-primary/10'
  },
  sunset: {
    g1: 'from-pink-500/10 to-transparent',
    g2: 'from-purple-500/10 to-transparent',
    g3: 'bg-pink-500/5'
  },
  cyberpunk: {
    g1: 'from-fuchsia-500/10 to-transparent',
    g2: 'from-violet-500/10 to-transparent',
    g3: 'bg-fuchsia-500/5'
  },
  ocean: {
    g1: 'from-sky-500/15 to-transparent',
    g2: 'from-blue-500/10 to-transparent',
    g3: 'bg-cyan-500/5'
  },
  volcanic: {
    g1: 'from-red-500/10 to-transparent',
    g2: 'from-orange-650/10 to-transparent',
    g3: 'bg-red-500/5'
  },
  'midnight-gold': {
    g1: 'from-amber-500/10 to-transparent',
    g2: 'from-yellow-600/10 to-transparent',
    g3: 'bg-amber-500/5'
  }
};

export function MeetupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, i18n } = useTranslation()
  const { getGameTitle, getGameCover } = useGameLocale()

  const {
    meetup,
    attendees,
    loading,
    joining,
    canceling,
    copySuccess,
    timeLeft,
    errorMsg,
    handleShare,
    handleJoinLeave,
    handleCancelMeetup,
    guestReservation,
    handleJoinAsGuest,
    handleLeaveAsGuest,
    handleAddManualGuest,
    handleCompleteMeetup,
    updateScores,
    updateBoardPhoto,
    updateFirstPlayer
  } = useMeetupDetail(id, user)

  const [showExportModal, setShowExportModal] = useState(false)
  const [showFirstPlayerModal, setShowFirstPlayerModal] = useState(false)
  const [showVictoryCardModal, setShowVictoryCardModal] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [selectedRatio, setSelectedRatio] = useState<'story' | 'square'>('story')
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const sessionAttendees = useMemo(() => {
    return attendees.map(a => ({
      id: a.id,
      name: a.username,
      avatarUrl: a.avatar_url,
      isGuest: Boolean(a.is_guest),
    }))
  }, [attendees])

  if (loading) {
    return <MeetupDetailSkeleton />
  }

  if (errorMsg || !meetup) {
    return (
      <section className="space-y-4 max-w-xl mx-auto p-4 text-center">
        <div className="text-destructive bg-destructive/10 px-4 py-6 rounded-2xl border border-destructive/20 space-y-3">
          <Info className="w-10 h-10 mx-auto text-destructive" />
          <h2 className="text-xl font-bold">{t('meetup.errorTitle')}</h2>
          <p className="text-sm font-medium text-foreground/80">{errorMsg || t('meetup.errorDesc')}</p>
        </div>
        <Button onClick={() => navigate('/')} icon={ArrowLeft} label={t('meetup.backToHome')} className="mx-auto" />
      </section>
    )
  }

  const userId = user?.id
  const isJoined = userId ? meetup.joined_players?.includes(userId) : false
  const isCreator = meetup.creator_id === userId
  const spotsRemaining = meetup.max_players - attendees.length
  const isFull = spotsRemaining <= 0
  const isPast = new Date(meetup.date).getTime() < new Date().getTime()

  return (
    <section className="space-y-6 max-w-4xl mx-auto p-0 pb-28 md:p-4 md:pb-32 lg:pb-12">
      
      {/* Back navigation and share toolbar (sticky on mobile with safe-area spacing) */}
      <div className="sticky top-[-2px] z-30 flex items-center justify-between pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 -mx-4 px-4 md:-mx-8 md:px-8 bg-background/90 backdrop-blur-md border-b border-border/20 transition-all duration-200">
        <Button 
          variant="ghost" 
          size="sm" 
          icon={ArrowLeft}
          onClick={() => navigate(-1)} 
          aria-label={t('common.back')}
          title={t('common.back')}
        >
          <span>{t('common.back')}</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFirstPlayerModal(true)}
            title={t('meetup.firstPlayerTooltip')}
            aria-label={t('meetup.firstPlayerTooltip')}
          >
            <Dices className="w-4 h-4 text-muted-foreground" />
            <span className="hidden sm:inline">{t('meetup.firstPlayerBtn')}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVictoryCardModal(true)}
            title={t('meetup.victoryCardTooltip')}
            aria-label={t('meetup.victoryCardBtn')}
          >
            <Trophy className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">{t('meetup.victoryCardBtn')}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            aria-label={copySuccess ? t('common.copied') : t('common.share')}
            title={copySuccess ? t('common.copied') : t('common.share')}
          >
            {copySuccess ? (
              <>
                <Check className="w-4 h-4 text-success" />
                <span className="text-success font-semibold">{t('common.copied')}</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-muted-foreground" />
                <span className="hidden xs:inline">{t('common.share')}</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Hero Header component */}
      <MeetupDetailHero
        meetup={meetup}
        isPast={isPast}
        isFull={isFull}
        spotsRemaining={spotsRemaining}
      />

      {/* Main Responsive Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Description, Attendees, Location */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Meetup Description */}
          <MeetupDetailDescription description={meetup.description} />

          {/* Attendees list grid */}
          <MeetupDetailAttendees
            attendees={attendees}
            maxPlayers={meetup.max_players}
            spotsRemaining={spotsRemaining}
            creatorId={meetup.creator_id}
            userId={userId}
            guestReservationId={guestReservation?.id}
            onAddGuest={handleAddManualGuest}
          />

          {/* Live Score Sheet */}
          <LiveScoreTracker
            initialScores={meetup.player_scores}
            attendees={sessionAttendees}
            isEditable={isJoined || isCreator}
            onSaveScores={updateScores}
          />

          {/* Final Board Photo */}
          <BoardPhotoUploader
            currentPhotoUrl={meetup.board_photo_url}
            meetupId={meetup.id}
            isEditable={isJoined || isCreator}
            onPhotoUploaded={updateBoardPhoto}
          />

          {/* Location details card or Online Logistics */}
          {meetup.is_online ? (
            <MeetupDetailOnline
              platform={meetup.platform || ''}
              voiceLink={meetup.voice_link}
              isAuthorized={isJoined || isCreator || Boolean(guestReservation)}
            />
          ) : (
            <MeetupDetailLocation
              location={meetup.location || ''}
              city={meetup.city || ''}
            />
          )}


        </div>

        {/* Right Columns - Sidebar */}
        <MeetupDetailSidebar
          meetup={meetup}
          attendees={attendees}
          isPast={isPast}
          isCreator={isCreator}
          isJoined={isJoined}
          isFull={isFull}
          joining={joining}
          canceling={canceling}
          timeLeft={timeLeft}
          user={user}
          handleJoinLeave={handleJoinLeave}
          handleCancelMeetup={handleCancelMeetup}
          guestReservation={guestReservation}
          handleJoinAsGuest={handleJoinAsGuest}
          handleLeaveAsGuest={handleLeaveAsGuest}
          handleCompleteMeetup={handleCompleteMeetup}
          onExportClick={() => setShowExportModal(true)}
          onFirstPlayerClick={() => setShowFirstPlayerModal(true)}
          onVictoryCardClick={() => setShowVictoryCardModal(true)}
        />
      </div>

      {/* Mobile Sticky Bottom Action Dock (Playtomic benchmark) */}
      <MeetupDetailActionDock
        meetup={meetup}
        attendees={attendees}
        isPast={isPast}
        isJoined={isJoined}
        isFull={isFull}
        joining={joining}
        spotsRemaining={spotsRemaining}
        guestReservation={guestReservation}
        handleJoinLeave={handleJoinLeave}
        onNavigateToChat={() => navigate(`/chats?id=${meetup.id}`)}
        isCreator={isCreator}
        handleCancelMeetup={handleCancelMeetup}
        canceling={canceling}
      />

      {/* Legal Attribution */}
      <div className="text-center pt-8 text-xs text-muted-foreground/60 font-semibold select-none border-t border-border/10 mt-6 w-full">
        {t('profile.collection.attribution')} <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors hover:underline">BoardGameGeek</a>
      </div>

      {/* Exportable Match Summary Modal */}
      <AnimatePresence>
        {showExportModal && (() => {
          const bgClass = BACKGROUNDS[selectedTheme] || BACKGROUNDS.default
          const glow = GLOWS[selectedTheme] || GLOWS.default
          const isStory = selectedRatio === 'story'

          // Set aspect classes dynamically
          const aspectClass = isStory 
            ? "w-full max-w-[340px] aspect-[9/16] p-6 mx-auto justify-between flex flex-col"
            : "w-full max-w-[420px] aspect-square p-6 mx-auto justify-between flex flex-col"

          const handleExportImage = async () => {
            if (!exportRef.current) return
            setExporting(true)

            try {
              await new Promise(resolve => setTimeout(resolve, 200))

              const dataUrl = await toPng(exportRef.current, {
                quality: 0.95,
                pixelRatio: 3,
                backgroundColor: '#030712',
                cacheBust: true,
                includeQueryParams: true,
                style: {
                  margin: '0',
                  transform: 'none',
                },
              })

              const filename = `resumen-${meetup.title.replace(/\s+/g, '-').toLowerCase() || 'partida'}.png`
              const link = document.createElement('a')
              link.download = filename
              link.href = dataUrl
              link.click()
            } catch (err) {
              console.error("Error exporting match summary image:", err)
            } finally {
              setExporting(false)
            }
          }

          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 lg:p-4 bg-black/85 backdrop-blur-md overflow-y-auto !mt-0">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-white/10 rounded-2xl max-w-3xl w-[94%] lg:w-full h-[88dvh] lg:h-auto overflow-hidden shadow-2xl flex flex-col max-h-[88dvh] lg:max-h-[95vh]"
              >
                {/* Modal Header bar */}
                <div className="py-3 px-4 border-b border-white/5 flex justify-between items-center bg-muted/40 z-10 font-inter shrink-0">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-primary" />
                    <h3 className="font-extrabold text-sm text-foreground truncate max-w-[150px] sm:max-w-md">
                      {t('meetup.exportSummary')}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleExportImage}
                      disabled={exporting}
                      className="shrink-0"
                      title={t('common.savePhoto')}
                      aria-label={t('common.savePhoto')}
                    >
                      {exporting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                          <span className="hidden sm:inline">{t('common.generating')}</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline">{t('common.savePhoto')}</span>
                        </>
                      )}
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setShowExportModal(false)}
                      aria-label={t('common.close')}
                      className="border border-white/10 hover:bg-white/10 text-white rounded-xl flex items-center justify-center shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Modal Main Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pb-6 grid grid-cols-1 md:grid-cols-5 gap-6 bg-background/95 custom-scrollbar min-h-0 font-inter">
                  
                  {/* Left Column: Settings (ordered second on mobile) */}
                  <div className="md:col-span-2 space-y-5 text-left order-2 md:order-1">
                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase text-muted-foreground tracking-widest block">{t('meetup.socialFormat')}</span>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => setSelectedRatio('story')}
                          variant="ghost"
                          className={cn(
                            "p-3 rounded-xl border text-xs font-bold text-center flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm shadow-sm h-auto hover:bg-transparent",
                            selectedRatio === 'story'
                              ? "border-primary bg-primary/15 text-primary dark:text-white font-black shadow-md shadow-primary/5"
                              : "border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                          )}
                        >
                          <span className="text-lg">📱</span>
                          <span>Story (9:16)</span>
                        </Button>
                        <Button
                          onClick={() => setSelectedRatio('square')}
                          variant="ghost"
                          className={cn(
                            "p-3 rounded-xl border text-xs font-bold text-center flex flex-col items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm shadow-sm h-auto hover:bg-transparent",
                            selectedRatio === 'square'
                              ? "border-primary bg-primary/15 text-primary dark:text-white font-black shadow-md shadow-primary/5"
                              : "border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                          )}
                        >
                          <span className="text-lg">🔳</span>
                          <span>Post (1:1)</span>
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-black uppercase text-muted-foreground tracking-widest block">{t('meetup.backgroundTheme')}</span>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.keys(BACKGROUNDS).map((themeKey) => (
                          <Button
                            key={themeKey}
                            onClick={() => setSelectedTheme(themeKey)}
                            variant="ghost"
                            className={cn(
                              "px-3 py-2.5 rounded-xl border text-xs font-extrabold capitalize text-left flex items-center gap-2 transition-all duration-200 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98] backdrop-blur-sm h-auto hover:bg-transparent",
                              selectedTheme === themeKey
                                ? "border-primary bg-primary/15 text-primary dark:text-white font-black shadow-md shadow-primary/5 shadow-inner"
                                : "border-white/5 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                            )}
                          >
                            <div className={cn("w-3.5 h-3.5 rounded-full bg-gradient-to-br border border-white/20 shrink-0 transition-transform duration-200", BACKGROUNDS[themeKey], selectedTheme === themeKey && "scale-110")} />
                            <span>{themeKey === 'default' ? t('profile.defaultBg') : t(`profile.${themeKey.replace(/-([a-z])/g, g => g[1].toUpperCase())}Bg`)}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 space-y-1.5 font-semibold">
                      <p className="text-xs font-extrabold text-primary dark:text-[#FF80B0] uppercase tracking-wider flex items-center gap-1">
                        {t('meetup.tipsTitle')}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t('meetup.tipsDesc')}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Canvas Preview (ordered first on mobile) */}
                  <div className="md:col-span-3 flex items-center justify-center p-2 rounded-2xl bg-zinc-950/40 border border-white/5 order-1 md:order-2 w-full relative">
                    
                    {/* On-screen Preview (Visible, responsive, NOT exported) */}
                    <div 
                      className={cn(
                        `border border-white/10 rounded-2xl bg-gradient-to-br ${bgClass} shadow-2xl relative overflow-hidden select-none w-full`,
                        aspectClass
                      )}
                    >
                      {/* Ambient Glow nodes inside preview */}
                      <div className={`absolute top-0 right-0 w-[60%] h-[50%] bg-gradient-to-br ${glow.g1} rounded-full blur-[70px] -z-10 pointer-events-none`} />
                      <div className={`absolute bottom-0 left-0 w-[60%] h-[50%] bg-gradient-to-tr ${glow.g2} rounded-full blur-[70px] -z-10 pointer-events-none`} />
                      <div className={`absolute top-[35%] left-[25%] w-[35%] h-[35%] ${glow.g3} rounded-full blur-[70px] -z-10 pointer-events-none`} />

                      {/* Preview Canvas Header */}
                      <div className="flex justify-between items-center border-b border-white/10 pb-3 w-full shrink-0">
                        <div className="text-left min-w-0 flex-1">
                          <span className="text-xs font-black text-primary uppercase tracking-widest block mb-0.5">{t('meetup.summaryLabel')}</span>
                          <h4 className="font-black text-white leading-tight truncate text-sm sm:text-base w-full">
                            {meetup.title}
                          </h4>
                        </div>
                      </div>

                      {/* Preview Canvas Body */}
                      {(() => {
                        const games = meetup.games || []
                        return (
                          <div className="flex-1 flex flex-col justify-center py-4 min-h-0 overflow-hidden">
                            <div className="flex-grow overflow-y-auto pr-1 custom-scrollbar flex flex-col gap-2.5 py-1 my-auto w-full">
                              {games.map((game) => {
                                const winningId = game.winner_user_id || game.winner_guest_id
                                const winner = winningId ? attendees.find(a => a.id === winningId) : null

                                return (
                                  <div 
                                    key={game.bgg_id} 
                                    className="rounded-xl border border-white/10 bg-zinc-950/70 backdrop-blur-md flex items-center justify-between gap-3 p-2.5 shadow-lg transition-all duration-200 w-full shrink-0"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      {(getGameCover(game) || game.image_url) ? (
                                        <img 
                                          src={`https://images.weserv.nl/?url=${encodeURIComponent((getGameCover(game) || game.image_url)!)}&w=120&h=120&fit=cover`} 
                                          alt={getGameTitle(game) || game.title} 
                                          className="w-10 h-10 rounded-lg object-cover border border-white/10 shrink-0 shadow-inner"
                                          crossOrigin="anonymous"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                                          <span className="text-xs text-zinc-500 font-bold">?</span>
                                        </div>
                                      )}
                                      <div className="min-w-0 text-left font-inter">
                                        <h5 className="font-extrabold text-white truncate text-xs">
                                          {getGameTitle(game)}
                                        </h5>
                                        <span className="text-xs text-zinc-400 font-bold block mt-0.5">
                                          {game.year_published || 'N/A'}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 font-inter">
                                      {game.is_expansion ? (
                                        <ExpansionBadge size="xs" />
                                      ) : winner ? (
                                        <>
                                          <div className="flex items-center gap-1 border border-amber-500/25 bg-amber-500/10 text-amber-400 font-black uppercase tracking-wide px-1.5 py-0.5 text-xs rounded-md">
                                            <Crown className="w-2.5 h-2.5 fill-current shrink-0 text-amber-400" />
                                            <span className="truncate max-w-[65px] sm:max-w-[85px]">{winner.username}</span>
                                          </div>
                                          {game.winner_score && (
                                            <span className="font-black bg-primary text-white border border-primary/20 shrink-0 text-xs px-1.5 py-0.5 rounded-md">
                                              {game.winner_score}
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          <span className="border border-white/10 bg-white/5 text-zinc-300 font-extrabold uppercase tracking-wide px-1.5 py-0.5 text-xs rounded-md">
                                            {t('meetup.draw')}
                                          </span>
                                          {game.winner_score && (
                                            <span className="font-black bg-white/10 text-zinc-300 border border-white/10 shrink-0 text-xs px-1.5 py-0.5 rounded-md">
                                              {game.winner_score}
                                            </span>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })()}

                      {/* Preview Canvas Footer */}
                      <div className="border-t border-white/10 pt-3 flex items-center justify-between text-xs text-zinc-300 font-bold select-none shrink-0">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{t('meetup.playedOn')} {formatDate(meetup.date, { day: 'numeric', month: 'short', year: 'numeric' }, i18n.language as any)} • LudiClub</span>
                        </span>
                        <span className="font-extrabold text-white">#LudiClub</span>
                      </div>
                    </div>

                    {/* Off-screen high-res Export Canvas (1080px width, absolutely positioned off-screen, used ONLY for export) */}
                    <div className="absolute left-[-9999px] top-[-9999px] pointer-events-none" style={{ width: '1080px' }}>
                      <div 
                        ref={exportRef} 
                        className={cn(
                          `border border-white/10 bg-gradient-to-br ${bgClass} shadow-2xl relative overflow-hidden select-none p-12 flex flex-col justify-between`,
                          isStory 
                            ? "w-[1080px] h-[1920px] rounded-[48px]"
                            : "w-[1080px] h-[1080px] rounded-[32px]"
                        )}
                      >
                        {/* Ambient Glow nodes inside print card (scaled for 1080px) */}
                        <div className={`absolute top-0 right-0 w-[70%] h-[50%] bg-gradient-to-br ${glow.g1} rounded-full blur-[200px] -z-10 pointer-events-none`} />
                        <div className={`absolute bottom-0 left-0 w-[70%] h-[50%] bg-gradient-to-tr ${glow.g2} rounded-full blur-[200px] -z-10 pointer-events-none`} />
                        <div className={`absolute top-[35%] left-[25%] w-[40%] h-[40%] ${glow.g3} rounded-full blur-[200px] -z-10 pointer-events-none`} />

                        {/* High-res Header */}
                        <div className="flex justify-between items-center border-b border-white/15 pb-6 w-full">
                          <div className="text-left font-inter min-w-0 flex-1">
                            <span className="text-sm font-black text-primary uppercase tracking-widest block mb-1.5">{t('meetup.summaryLabel')}</span>
                            <h4 className="font-black text-white leading-tight truncate text-4xl w-full">
                              {meetup.title}
                            </h4>
                          </div>
                        </div>

                        {/* High-res Body */}
                        {(() => {
                          const games = meetup.games || []
                          return (
                            <div className="flex-1 flex flex-col justify-center py-8 min-h-0">
                              <div className="flex flex-col gap-5 justify-center">
                                {games.map((game) => {
                                  const winningId = game.winner_user_id || game.winner_guest_id
                                  const winner = winningId ? attendees.find(a => a.id === winningId) : null

                                  return (
                                    <div 
                                      key={game.bgg_id} 
                                      className="border border-white/10 bg-zinc-950/75 backdrop-blur-lg flex items-center justify-between gap-6 p-6 rounded-[24px] shadow-2xl transition-all duration-200"
                                    >
                                      <div className="flex items-center gap-5 min-w-0 flex-1">
                                        {(getGameCover(game) || game.image_url) ? (
                                          <img 
                                            src={`https://images.weserv.nl/?url=${encodeURIComponent((getGameCover(game) || game.image_url)!)}&w=250&h=250&fit=cover`} 
                                            alt={getGameTitle(game) || game.title} 
                                            className="w-16 h-16 rounded-[14px] object-cover border border-white/10 shrink-0 shadow-inner"
                                            crossOrigin="anonymous"
                                          />
                                        ) : (
                                          <div className="w-16 h-16 rounded-[14px] bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                                            <span className="text-xl text-zinc-500 font-bold">?</span>
                                          </div>
                                        )}
                                        <div className="min-w-0 text-left font-inter">
                                          <h5 className="font-black text-white truncate text-xl">
                                            {getGameTitle(game)}
                                          </h5>
                                          <span className="text-xs text-zinc-400 font-bold block mt-1">
                                            {game.year_published || 'N/A'}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-3 shrink-0 font-inter">
                                        {game.is_expansion ? (
                                          <ExpansionBadge size="sm" />
                                        ) : winner ? (
                                          <>
                                            <div className="flex items-center gap-1.5 border border-amber-500/25 bg-amber-500/10 text-amber-400 font-black uppercase tracking-wide px-3.5 py-1.5 text-sm rounded-xl">
                                              <Crown className="w-4 h-4 fill-current shrink-0 text-amber-400" />
                                              <span className="truncate max-w-[150px]">{winner.username}</span>
                                            </div>
                                            {game.winner_score && (
                                              <span className="font-black bg-primary text-white border border-primary/20 shrink-0 text-sm px-3.5 py-1.5 rounded-xl">
                                                {game.winner_score}
                                              </span>
                                            )}
                                          </>
                                        ) : (
                                          <>
                                            <span className="border border-white/10 bg-white/5 text-zinc-300 font-extrabold uppercase tracking-wide px-3.5 py-1.5 text-sm rounded-xl">
                                              {t('meetup.draw')}
                                            </span>
                                            {game.winner_score && (
                                              <span className="font-black bg-white/10 text-zinc-300 border border-white/10 shrink-0 text-sm px-3.5 py-1.5 rounded-xl">
                                                {game.winner_score}
                                              </span>
                                            )}
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })()}

                        {/* High-res Footer */}
                        <div className="border-t border-white/15 pt-6 flex items-center justify-between text-xs text-zinc-300 font-bold select-none font-inter">
                          <span className="flex items-center gap-2.5">
                            <Calendar className="w-5 h-5 text-primary shrink-0" />
                            <span>{t('meetup.playedOn')} {formatDate(meetup.date, { day: 'numeric', month: 'long', year: 'numeric' }, i18n.language as any)} • LudiClub</span>
                          </span>
                          <span className="font-extrabold text-sm text-white">#LudiClub</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            </div>
          )
        })()}
      </AnimatePresence>

      {/* First Player Multitouch Selector Modal */}
      <FirstPlayerSelector
        isOpen={showFirstPlayerModal}
        onClose={() => setShowFirstPlayerModal(false)}
        attendees={sessionAttendees}
        onSelectFirstPlayer={(_, name) => updateFirstPlayer(name)}
      />

      {/* WhatsApp Victory Card Modal */}
      <VictoryCardModal
        isOpen={showVictoryCardModal}
        onClose={() => setShowVictoryCardModal(false)}
        meetup={meetup}
        scores={meetup.player_scores}
        language={i18n.language as any}
      />
    </section>
  )
}
export default MeetupDetailPage;
